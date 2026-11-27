import { useEffect, useState } from "react";

import { texts } from "@/texts";
import type { FigurinhaComunidade } from "@/types/application/figurinhas/figurinha-comunidade";
import type { EmotePickerItem } from "@/types/components/emotes/emote-picker-item";
import type { EmotePickerTab } from "@/types/components/emotes/emote-picker-tab";
import type { ListaDoSeletorProps } from "@/types/components/emotes/lista-do-seletor-props";
import type { RecentEmote } from "@/types/components/emotes/recent-emote";
import { EmotePickerDialogView, EmotePickerIcon } from "@rede-enois/design-system/domain";
import { Button, Dialog, DialogContent, DialogTitle } from "@rede-enois/design-system/ui";

import { resolveCdnUrl } from "@/lib/api/media";
import { getCurrentUserId } from "@/lib/current-user";
import { emoteImageUrl, emotesApi } from "@/lib/emotes/api";
import { filterEnoisEmojis, getEnoisEmojiSrc } from "@/lib/emotes/enois-pack";
import { loadRecentEmotes, rememberRecentEmote } from "@/lib/emotes/recent-emotes";
import { EMOTES_POR_PAGINA, useCatalogoDoSeletor, useEmoteIndex } from "@/lib/emotes/use-emotes";
import { paginaDaComunidade } from "@/lib/figurinhas/pagina-da-comunidade";
import { FIGURINHAS_POR_PAGINA } from "@/lib/figurinhas/use-figurinhas";

import { EnvioDeFigurinha } from "@/components/figurinhas/envio-de-figurinha";

/** Pausa da busca: sem ela, cada tecla vira uma página nova no backend. */
const ESPERA_DA_BUSCA = 250;

/** A caixa do seletor: dele sai o envio, que fecha a lista e mostra o formulário por cima. */
function FormularioDeEnvioDoSeletor({
  aberto,
  onFechar,
  onPublicada,
}: {
  aberto: boolean;
  onFechar: () => void;
  onPublicada: (figurinha: FigurinhaComunidade) => void;
}) {
  const logado = Boolean(getCurrentUserId());

  return (
    <Dialog open={aberto} onOpenChange={(open) => (open ? undefined : onFechar())}>
      <DialogContent>
        <DialogTitle>{texts.figurinhas.envio.titulo}</DialogTitle>

        <EnvioDeFigurinha logado={logado} aoPublicar={onPublicada} />
      </DialogContent>
    </Dialog>
  );
}

const paginaDeTerceiros = (page: number, termo: string) =>
  emotesApi.page(page, EMOTES_POR_PAGINA, termo || undefined);

const paginaDaComunidadeSeletor = (page: number, termo: string) =>
  paginaDaComunidade(page, termo, FIGURINHAS_POR_PAGINA);

/** O código do seletor sem os dois-pontos é o que o campo de escrita insere. */
const codigoDoSeletor = (codigo: string) => codigo.replace(/^:|:$/g, "");

/** A figurinha recém-publicada já no formato da grade (o código cru, sem dois-pontos). */
const figurinhaDoSeletor = (figurinha: FigurinhaComunidade) => ({
  code: codigoDoSeletor(figurinha.codigo),
  src: figurinha.imagem,
});

/**
 * A imagem que a grade desenha. O catálogo de terceiros já vem com o caminho do proxy; a figurinha
 * da comunidade é uma mídia do site, que passa por `resolveCdnUrl` como em qualquer outro lugar
 * (com o CDN configurado, o arquivo é pedido no próprio CDN).
 */
const comDesenho = (itens: { code: string; src?: string }[]): EmotePickerItem[] =>
  itens.map((item) => ({
    code: item.code,
    src: item.src ? resolveCdnUrl(emoteImageUrl(item.src)) : undefined,
  }));

/**
 * Container do seletor de figurinhas: busca os dados, guarda o estado de abertura e desenha pela
 * view do design system (`EmotePickerDialogView`).
 *
 * A view é a do DS — a mesma que a barra de formatação usa —, com busca, abas, grade e páginas. O
 * que mora aqui é só o que precisa de rede, sessão ou aparelho: as páginas do catálogo e da
 * comunidade, as Recentes gravadas no aparelho, o pacote É Nóis e o formulário de envio. O
 * "Enviar figurinha" fica no rodapé, ao lado da dica: a view não tem lugar para uma ação que não é
 * aba.
 *
 * A caixa é montada a cada abertura — fechar e abrir de novo começa do começo, não no meio de uma
 * busca antiga. Recentes aparecem por cima do catálogo quando há algo lá (issue #555): buscar ali
 * cai na lista do backend.
 */
export function ListaDoSeletor({
  onAbertoMudou,
  onSelect,
  onEnviar,
  abaInicial,
}: ListaDoSeletorProps) {
  // O que foi publicado enquanto este seletor está aberto, na frente da página do backend.
  const [publicadas, setPublicadas] = useState<FigurinhaComunidade[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recentes, setRecentes] = useState<RecentEmote[]>(() => loadRecentEmotes());
  const [aba, setAba] = useState<EmotePickerTab>(abaInicial);
  // Toda aba de catálogo abre nas Recentes (issue #555); buscar ou escolher outra lista as tira de
  // cena, e é escolher Recentes de volta que as traz.
  const [recentesAFrente, setRecentesAFrente] = useState(recentes.length > 0);
  // Fechado, o seletor só lê o índice em cache: abrir o campo de escrita não custa requisição. O
  // índice é reserva das entradas antigas — a aba Recentes desenha o que está no aparelho.
  const index = useEmoteIndex(true);
  // A figurinha que saiu do catálogo ainda é a que a pessoa usou: sem miniatura salva e sem índice,
  // é a célula que fica sem imagem — a lista não some.
  const recentesVisiveis = recentes.map((item) => ({
    code: item.code,
    src: item.thumb ?? getEnoisEmojiSrc(item.code) ?? index.get(item.code) ?? undefined,
  }));

  // A busca só vai ao backend depois de uma pausa: cada tecla dispararia uma página nova. O termo
  // e a página voltam ao começo JUNTOS — separados, o app pediria a página atual com o termo novo
  // e logo em seguida a primeira página, dois pedidos para o mesmo resultado.
  useEffect(() => {
    const proximoTermo = busca.trim();
    if (proximoTermo === termo) return;
    const timer = setTimeout(() => {
      setTermo(proximoTermo);
      setPagina(1);
    }, ESPERA_DA_BUSCA);
    return () => clearTimeout(timer);
  }, [busca, termo]);

  // Buscar nas Recentes cai no catálogo (a lista inteira, filtrada pelo termo).
  const mostrandoRecentes = recentesAFrente && !busca.trim() && recentesVisiveis.length > 0;
  const mostrandoEnois = aba === "enois";
  const mostrandoComunidade = aba === "community";
  // A grade do DS é todo o catálogo (De terceiros, Da comunidade) e também as Recentes buscadas,
  // que caem nele; Recentes e É Nóis são listas do app, desenhadas pela mesma view com `localTab`.
  const mostrandoGrade = !mostrandoRecentes && aba !== "enois";
  const enoisFiltrados = mostrandoEnois
    ? filterEnoisEmojis(busca).map((item) => ({ code: item.code, src: item.src }))
    : [];
  // A aba que está na grade é a que pede página: trocar de aba não deixa o pedido da anterior em
  // voo para desenhar depois.
  const buscarNaGrade = mostrandoRecentes || mostrandoGrade;

  const aoPublicar = (figurinha: FigurinhaComunidade) =>
    setPublicadas((atuais) => [figurinha, ...atuais]);
  const abrirEnvio = () => {
    setEnviando(true);
    onEnviar();
  };

  const escolher = (code: string, thumb?: string) => {
    setRecentes(rememberRecentEmote({ code, thumb: thumb ?? null }));
    onSelect(code);
  };

  // As duas grades de catálogo são a mesma view; o que muda é de onde vem a página. As funções são
  // estáveis (module scope), então cada catálogo guarda a própria página e a própria busca.
  const deTerceiros = useCatalogoDoSeletor(
    "terceiros",
    paginaDeTerceiros,
    pagina,
    termo,
    buscarNaGrade && !mostrandoComunidade,
  );
  const comunidade = useCatalogoDoSeletor(
    "comunidade",
    paginaDaComunidadeSeletor,
    pagina,
    termo,
    buscarNaGrade && mostrandoComunidade,
  );
  const { data, isLoading, isError, isPlaceholderData } = mostrandoComunidade
    ? comunidade
    : deTerceiros;

  // Recentes é o estado da abertura, e escolher outra lista as tira de cena; escolher Recentes de
  // volta as traz. A view trata Recentes não vazio com busca como catálogo (o termo filtra a lista
  // inteira), que é o mesmo comportamento daqui.
  const escolherAba = (value: string) => {
    setRecentesAFrente(value === "recent");
    setAba(value === "recent" ? "third" : (value as EmotePickerTab));
  };

  const abas = [
    ...(recentesVisiveis.length > 0 && !busca.trim()
      ? [{ value: "recent", label: texts.emotes.tabRecent }]
      : []),
    { value: "enois", label: texts.emotes.tabEnois },
    { value: "third", label: texts.emotes.tabThirdParty },
    { value: "community", label: texts.emotes.tabCommunity },
  ];

  // `src` é o que a grade desenha: a miniatura do proxy (`/api/emotes/...`), como sempre. O
  // clique devolve o caminho CRU do backend (`/emotes/image/...`), que é o formato que o Recentes
  // valida e guarda (`recent-emotes` recusa URL fora do padrão); o do pacote É Nóis
  // (`/emojis/...`) é o mesmo nos dois.
  const crus = mostrandoComunidade
    ? [
        ...(!termo ? publicadas.map(figurinhaDoSeletor) : []),
        ...(data?.items ?? [])
          .filter(
            (emote) =>
              !publicadas.some((figurinha) => codigoDoSeletor(figurinha.codigo) === emote.code),
          )
          .map((emote) => ({ code: emote.code, src: emote.thumb })),
      ]
    : (data?.items ?? []).map((emote) => ({ code: emote.code, src: emote.thumb }));
  // As listas do aparelho (Recentes) e do pacote (É Nóis) desenham pela mesma view, com `localTab`.
  const crusDaGrade = comDesenho(crus);
  // O item volta do clique com o `src` desenhado; o Recentes precisa do cru por trás dele.
  const cruPorDesenho = new Map(crus.map((item, indice) => [crusDaGrade[indice]?.src, item.src]));
  const itens = mostrandoGrade
    ? crusDaGrade
    : comDesenho(mostrandoRecentes ? recentesVisiveis : enoisFiltrados);
  const caminhoCru = (item: EmotePickerItem) =>
    cruPorDesenho.get(item.src) ??
    recentesVisiveis.find((recente) => recente.code === item.code)?.src ??
    item.src;

  return (
    <>
      <EmotePickerDialogView
        open
        onOpenChange={(open) => {
          if (!open) onAbertoMudou(false);
        }}
        query={busca}
        onQueryChange={setBusca}
        tab={mostrandoRecentes ? "recent" : aba}
        onTabChange={escolherAba}
        tabs={abas}
        items={itens}
        localTab={!mostrandoGrade && !mostrandoRecentes}
        localTotal={!mostrandoGrade && !mostrandoRecentes ? itens.length : undefined}
        loading={isLoading}
        error={isError}
        stale={isPlaceholderData}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPagina}
        onSelect={(item) => escolher(item.code, caminhoCru(item))}
      />

      {/* A view não tem lugar para uma ação que não é aba: o envio fica logo abaixo dela. */}
      <Button type="button" variant="ghost" size="sm" onClick={abrirEnvio}>
        {texts.emotes.botaoEnviar}
      </Button>

      <FormularioDeEnvioDoSeletor
        aberto={enviando}
        onFechar={() => setEnviando(false)}
        onPublicada={aoPublicar}
      />
    </>
  );
}

export { EmotePickerIcon };
