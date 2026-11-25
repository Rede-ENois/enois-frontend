import { useEffect, useId, useState } from "react";

import { texts } from "@/texts";
import type { EmotePickerDialogProps } from "@/types/components/emotes/emote-picker-dialog-props";
import type { EmotePickerItem } from "@/types/components/emotes/emote-picker-item";
import type { EmotePickerTab } from "@/types/components/emotes/emote-picker-tab";
import type { RecentEmote } from "@/types/components/emotes/recent-emote";
import {
  EmotePickerDialogView,
  EmotePickerIcon,
  EmotePickerTriggerButton,
} from "@rede-enois/design-system/domain";

import { emoteImageUrl } from "@/lib/emotes/api";
import { filterEnoisEmojis, getEnoisEmojiSrc } from "@/lib/emotes/enois-pack";
import { loadRecentEmotes, rememberRecentEmote } from "@/lib/emotes/recent-emotes";
import { useEmoteIndex, useEmotePage } from "@/lib/emotes/use-emotes";

/** Pausa da busca: sem ela, cada tecla vira uma página nova no backend. */
const ESPERA_DA_BUSCA = 250;

/**
 * Seletor de figurinhas, no formato dos chats: busca e a grade. O clique devolve o CÓDIGO
 * (`KEKW`), que entra no texto como qualquer palavra.
 *
 * A lista é UMA só — populares primeiro, depois o resto em ordem alfabética — e vem PAGINADA do
 * backend (`GET /emotes?page&limit&q`), 40 por vez. Não há filtro por coleção: quem escolhe a
 * figurinha quer achar o código, não saber de qual provedor ela veio.
 *
 * A aba É Nóis é o pacote oficial da plataforma, com a lista inteira — e só ele, nada de BTTV ou
 * FrankerFaceZ. Nada aqui fala com esses provedores: quem mantém o catálogo é o nosso backend, que
 * também serve a imagem (`/emotes/image/...`). É isso que garante que toda figurinha da lista já
 * está no cache do site — e aparece igual no texto de quem lê.
 *
 * O desenho é do DS (`EmotePickerDialogView`, com o `EmotePickerTriggerButton` como botão): aqui
 * ficam só as escolhas — qual aba está aberta, o que vai na grade e o que o clique guarda.
 */
export function EmotePickerDialog({ onOpenChange, onSelect }: EmotePickerDialogProps) {
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recentes, setRecentes] = useState<RecentEmote[]>([]);
  const [aba, setAba] = useState<EmotePickerTab>("third");
  const [aberto, setAberto] = useState(false);
  // Liga o botão ao seletor: são irmãos, e o botão nasce onde o campo de escrita o põe.
  const id = useId();
  // Fechado, o seletor só lê o índice em cache: abrir o campo de escrita não custa requisição. O
  // índice é reserva das entradas antigas — a aba Recentes desenha o que está no aparelho.
  const index = useEmoteIndex(aberto);
  // A figurinha que saiu do catálogo ainda é a que a pessoa usou: sem miniatura salva e sem índice,
  // é a célula que fica sem imagem — a lista não some.
  const recentesVisiveis = recentes.map((item) => ({
    code: item.code,
    src: item.thumb ?? getEnoisEmojiSrc(item.code) ?? index.get(item.code) ?? undefined,
  }));

  // A busca só vai ao backend depois de uma pausa: cada tecla dispararia uma página nova. O termo
  // e a página voltam ao começo JUNTOS — separados, o app pediria a página atual com o termo novo
  // e logo em seguida a primeira página, dois pedidos para o mesmo resultado. Sem termo novo não há
  // o que recomeçar: abrir o seletor também rodava esta espera e desfazia a troca de página.
  useEffect(() => {
    if (!aberto) return;
    const proximoTermo = busca.trim();
    if (proximoTermo === termo) return;
    const timer = setTimeout(() => {
      setTermo(proximoTermo);
      setPagina(1);
    }, ESPERA_DA_BUSCA);
    return () => clearTimeout(timer);
  }, [busca, aberto, termo]);

  // Fechou: da próxima vez começa do começo, não no meio de uma busca antiga. Abrindo, começa em
  // Recentes quando há algo lá (issue #555); senão, no catálogo.
  useEffect(() => {
    if (!aberto) {
      setBusca("");
      setTermo("");
      setPagina(1);
      return;
    }
    const salvos = loadRecentEmotes();
    setRecentes(salvos);
    setAba(salvos.length > 0 ? "recent" : "third");
  }, [aberto]);

  // Buscar em Recentes cai em De terceiros; em É Nóis a busca é local, na lista do pacote.
  const mostrandoRecentes = aba === "recent" && !busca.trim() && recentesVisiveis.length > 0;
  const mostrandoEnois = aba === "enois";
  const enoisFiltrados = mostrandoEnois
    ? filterEnoisEmojis(busca).map((item) => ({ code: item.code, src: item.src }))
    : [];

  const escolher = (code: string, thumb?: string) => {
    setRecentes(rememberRecentEmote({ code, thumb: thumb ?? null }));
    onSelect(code);
  };

  const { data, isLoading, isError, isPlaceholderData } = useEmotePage(
    pagina,
    termo,
    aberto && !mostrandoRecentes && !mostrandoEnois,
  );

  const abas = [
    ...(recentesVisiveis.length > 0 && !busca.trim()
      ? [{ value: "recent", label: texts.emotes.tabRecent }]
      : []),
    { value: "enois", label: texts.emotes.tabEnois },
    { value: "third", label: texts.emotes.tabThirdParty },
  ];

  // `src` é o que a grade desenha: a miniatura do proxy (`/api/emotes/...`), como sempre. O
  // clique devolve o caminho CRU do backend (`/emotes/image/...`), que é o formato que o Recentes
  // valida e guarda (`recent-emotes` recusa URL fora do padrão); o do pacote É Nóis
  // (`/emojis/...`) é o mesmo nos dois.
  const crus: EmotePickerItem[] = mostrandoRecentes
    ? recentesVisiveis
    : mostrandoEnois
      ? enoisFiltrados
      : (data?.items ?? []).map((emote) => ({ code: emote.code, src: emote.thumb }));
  const itens: EmotePickerItem[] = crus.map((item) => ({
    code: item.code,
    src: item.src ? emoteImageUrl(item.src) : undefined,
  }));
  // O item volta do clique com o `src` desenhado; o Recentes precisa do cru por trás dele.
  const cruPorDesenho = new Map(crus.map((item, indice) => [itens[indice]?.src, item.src]));
  const caminhoCru = (item: EmotePickerItem) => cruPorDesenho.get(item.src) ?? item.src;

  return (
    <>
      <EmotePickerDialogView
        id={id}
        open={aberto}
        onOpenChange={(open) => {
          setAberto(open);
          onOpenChange?.(open);
        }}
        onSelect={(item) => escolher(item.code, caminhoCru(item))}
        query={busca}
        onQueryChange={setBusca}
        tab={aba}
        onTabChange={(value) => setAba(value as EmotePickerTab)}
        tabs={abas}
        items={itens}
        localTab={mostrandoRecentes || mostrandoEnois}
        loading={isLoading}
        error={isError}
        stale={isPlaceholderData}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPagina}
      />
      <EmotePickerTriggerButton
        id={id}
        trigger={<EmotePickerIcon />}
        label={texts.emotes.button}
        onOpen={() => setAberto(true)}
      />
    </>
  );
}

export { EmotePickerIcon };
