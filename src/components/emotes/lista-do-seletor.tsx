import { createElement, useEffect, useId, useState } from "react";
import type { ReactNode } from "react";

import { texts } from "@/texts";
import type { FigurinhaComunidade } from "@/types/application/figurinhas/figurinha-comunidade";
import type { EmotePickerItem } from "@/types/components/emotes/emote-picker-item";
import type { EmotePickerTab } from "@/types/components/emotes/emote-picker-tab";
import type { ListaDoSeletorProps } from "@/types/components/emotes/lista-do-seletor-props";
import type { RecentEmote } from "@/types/components/emotes/recent-emote";
import { EmoteCell, EmotePageButton, EmotePickerIcon } from "@rede-enois/design-system/domain";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  LoadingState,
  MetaLine,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@rede-enois/design-system/ui";
import { Search } from "lucide-react";

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

/** A rolagem da grade, com a página que está chegando ainda por baixo, apagada. */
const gradeRolavel = (stale: boolean) =>
  `min-h-52 max-h-96 min-w-0 overflow-y-auto overscroll-contain pr-1 ${stale ? "opacity-60 transition-opacity" : ""}`;

/**
 * As caixas que a view do seletor desenha entre as views do DS: a lupa sobre o campo, a faixa com
 * o envio, a rolagem da grade, a grade com as colunas das células e o rodapé com o contador e as
 * páginas. Ficam fora do JSX de propósito — o app compõe views do DS, e a caixa de composição é o
 * construtor com o tema, não uma tag aberta na tela.
 */
const caixa = (tema: string, children: ReactNode) =>
  createElement("div", { className: tema }, children);
const grade = (tema: string, children: ReactNode) =>
  createElement("div", { className: tema }, children);

const TEMA_DA_LUPA = "absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-subtle";
const TEMA_DA_BUSCA = "relative min-w-0";
/** A caixa do seletor: a moldura da view do DS, com a faixa de abas e o envio na mesma grade. */
const TEMA_DO_SELETOR =
  "grid grid-rows-[auto_auto_minmax(0,1fr)_auto] max-h-[85dvh] max-w-md overflow-hidden p-4";
/**
 * No celular a faixa vira uma coluna: ao lado de várias abas, o envio some para fora da tela. A
 * ordem do desenho é a das abas; só o envio sobe, para ficar em cima delas.
 */
const TEMA_DA_FAIXA =
  "flex min-w-0 flex-wrap items-center justify-between gap-x-2 max-sm:flex-col max-sm:items-start max-sm:gap-y-1";
const TEMA_DAS_ABAS = "min-w-0 max-sm:w-full max-sm:[&_[role=tablist]]:flex-wrap";
const TEMA_DO_ENVIO = "max-sm:order-first";
/** A faixa de abas e a linha do envio dentro dela (o JSX só compõe as views). */
const caixaDaFaixa = (tema: string, conteudo: ReactNode) =>
  createElement("div", { className: tema }, conteudo);
const TEMA_DAS_CELULAS = "grid grid-cols-8 gap-0.5 sm:grid-cols-10";
const TEMA_DO_RODAPE = "flex items-center justify-between gap-2";
const TEMA_DAS_PAGINAS = "flex items-center gap-1";

/** A busca: a lupa dentro do campo, e o foco nela quando o seletor abre. */
const BuscaDoSeletor = ({ valor, aoMudar }: { valor: string; aoMudar: (valor: string) => void }) =>
  caixa(
    TEMA_DA_BUSCA,
    <>
      <Search {...{ className: TEMA_DA_LUPA }} />
      <Input
        aria-label={texts.emotes.searchPlaceholder}
        value={valor}
        onChange={(event) => aoMudar(event.target.value)}
        placeholder={texts.emotes.searchPlaceholder}
        {...{ className: "pl-8" }}
        autoFocus
      />
    </>,
  );

/** Quantas figurinhas, e as páginas quando há mais de uma: o rodapé da grade. */
function RodapeDoSeletor({
  total,
  page,
  totalPages,
  onPageChange,
}: {
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (total === 0) return null;

  return caixa(
    TEMA_DO_RODAPE,
    <>
      <MetaLine>{texts.emotes.count(total)}</MetaLine>

      {totalPages > 1 &&
        caixa(
          TEMA_DAS_PAGINAS,
          <>
            <EmotePageButton
              direction="previous"
              label={texts.emotes.previous}
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            />

            <MetaLine nowrap>{texts.emotes.page(page, totalPages)}</MetaLine>

            <EmotePageButton
              direction="next"
              label={texts.emotes.next}
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            />
          </>,
        )}
    </>,
  );
}

/** A grade das listas locais, com as mesmas colunas da grade de catálogo do DS. */
const GradeDeFigurinhas = ({ children }: { children: ReactNode }) =>
  grade(TEMA_DAS_CELULAS, children);

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
 * A caixa aberta do seletor: busca, abas, a grade e o rodapé. Monta a cada abertura — fechar e
 * abrir de novo começa do começo, não no meio de uma busca antiga.
 *
 * A caixa é desta tela, e a view do DS desenha a grade e o rodapé dentro dela (`open` sempre
 * verdadeiro): a view não tem lugar para uma ação que não é aba, e "Enviar figurinha" precisa
 * ficar ao lado das listas para ser achado. A faixa de abas daqui tem os mesmos valores e abas da
 * view, e as duas trocam a mesma aba. Recentes e É Nóis sem busca são listas do aparelho e do
 * pacote: usam as mesmas células do DS, com a mesma geometria da grade.
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
  // Recentes aparecem por cima do catálogo quando há algo lá (issue #555): a aba de trás segue
  // sendo a de catálogo, então buscar ali cai na lista do backend.
  const [aba, setAba] = useState<EmotePickerTab>(abaInicial);
  // Toda aba de catálogo abre nas Recentes (issue #555); buscar ou escolher outra lista as tira de
  // cena, e é escolher Recentes de volta que as traz.
  const [recentesAFrente, setRecentesAFrente] = useState(recentes.length > 0);
  // Liga o botão ao seletor: são irmãos, e o botão nasce onde o campo de escrita o põe.
  const id = useId();
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

  const mostrarSeletor = (open: boolean) => {
    if (open) return;
    onAbertoMudou(false);
  };

  // Buscar nas Recentes cai no catálogo (a lista inteira, filtrada pelo termo).
  const mostrandoRecentes = recentesAFrente && !busca.trim() && recentesVisiveis.length > 0;
  const mostrandoEnois = aba === "enois";
  const mostrandoComunidade = aba === "community";
  // A grade do DS é todo o catálogo (De terceiros, Da comunidade) e também as Recentes buscadas,
  // que caem nele; Recentes e É Nóis são listas do app, desenhadas aqui.
  const mostrandoGrade = !mostrandoRecentes && aba !== "enois";
  const enoisFiltrados = mostrandoEnois
    ? filterEnoisEmojis(busca).map((item) => ({ code: item.code, src: item.src }))
    : [];
  // A aba que está na grade é a que pede página: trocar de aba não deixa o pedido da anterior em
  // voo para desenhar depois.
  const buscarNaGrade = mostrandoRecentes || mostrandoGrade;
  // Buscar nas Recentes cai na grade de catálogo, e a busca é a da view; É Nóis filtra a lista do
  // app na hora.
  const mostrandoBusca = mostrandoRecentes && Boolean(busca.trim());

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

  // A faixa de abas (a de cá) é a única: a da view fica escondida dentro da moldura que some.
  // Recentes é o estado da abertura, e escolher outra lista as tira de cena; escolher Recentes de
  // volta as traz.
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
  const itens = comDesenho(crus);
  // O item volta do clique com o `src` desenhado; o Recentes precisa do cru por trás dele.
  const cruPorDesenho = new Map(crus.map((item, indice) => [itens[indice]?.src, item.src]));
  const caminhoCru = (item: EmotePickerItem) => cruPorDesenho.get(item.src) ?? item.src;

  // As listas do aparelho e do pacote desenham aqui, nas mesmas células do DS; as de catálogo
  // desenham pela view, que também traz carregando, erro e o rodapé de páginas.
  const locais = comDesenho(mostrandoRecentes ? recentesVisiveis : enoisFiltrados);

  return (
    <>
      <Dialog open onOpenChange={mostrarSeletor}>
        <DialogContent {...{ className: TEMA_DO_SELETOR }}>
          <DialogHeader>
            <DialogTitle>{texts.emotes.title}</DialogTitle>
          </DialogHeader>

          {caixaDaFaixa(
            TEMA_DA_FAIXA,
            <>
              {caixaDaFaixa(
                TEMA_DAS_ABAS,
                <Tabs value={mostrandoRecentes ? "recent" : aba} onValueChange={escolherAba}>
                  <TabsList>
                    {abas.map((item) => (
                      <TabsTrigger key={item.value} value={item.value}>
                        {item.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>,
              )}

              {caixaDaFaixa(
                TEMA_DO_ENVIO,
                <Button type="button" variant="ghost" size="sm" onClick={abrirEnvio}>
                  {texts.emotes.botaoEnviar}
                </Button>,
              )}
            </>,
          )}

          {mostrandoBusca || mostrandoGrade ? (
            // A grade da view é todo o catálogo (De terceiros, Da comunidade) e as Recentes buscadas:
            // mesmas células, mesmas colunas e a mesma rolagem, sem estado de carregando, porque a
            // página anterior fica na tela, apagada, até a nova chegar.
            <>
              <BuscaDoSeletor valor={busca} aoMudar={setBusca} />

              {isLoading && <LoadingState label={texts.emotes.loading} />}

              {caixa(
                gradeRolavel(isPlaceholderData),
                <>
                  {isError ? (
                    <EmptyState title={texts.emotes.error} />
                  ) : (
                    <GradeDeFigurinhas>
                      {itens.map((item) => (
                        <EmoteCell
                          key={item.code}
                          code={item.code}
                          src={item.src}
                          onSelect={() => escolher(item.code, caminhoCru(item))}
                        />
                      ))}
                    </GradeDeFigurinhas>
                  )}
                </>,
              )}

              {!isError && (data?.total ?? 0) === 0 && !isLoading && (
                <EmptyState title={texts.emotes.empty} />
              )}

              <RodapeDoSeletor
                total={data?.total ?? 0}
                page={data?.page ?? 1}
                totalPages={data?.totalPages ?? 1}
                onPageChange={setPagina}
              />
            </>
          ) : (
            <>
              <BuscaDoSeletor valor={busca} aoMudar={setBusca} />

              {caixa(
                gradeRolavel(false),
                <>
                  {locais.length === 0 ? (
                    <EmptyState title={texts.emotes.empty} />
                  ) : (
                    <GradeDeFigurinhas>
                      {locais.map((item) => (
                        <EmoteCell
                          key={item.code}
                          code={item.code}
                          src={item.src}
                          onSelect={() => escolher(item.code, caminhoCru(item))}
                        />
                      ))}
                    </GradeDeFigurinhas>
                  )}
                </>,
              )}

              {locais.length > 0 && <MetaLine>{texts.emotes.count(locais.length)}</MetaLine>}
            </>
          )}

          {/* A dica do rodapé é a mesma da view, e diz como o código entra no texto. */}
          <MetaLine>{texts.emotes.hint}</MetaLine>
        </DialogContent>
      </Dialog>

      <FormularioDeEnvioDoSeletor
        aberto={enviando}
        onFechar={() => setEnviando(false)}
        onPublicada={aoPublicar}
      />
    </>
  );
}

export { EmotePickerIcon };
