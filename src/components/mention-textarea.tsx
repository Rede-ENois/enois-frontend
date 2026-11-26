import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  type MentionTextareaHandle,
  type MentionTextareaProps,
  MentionTextarea as MentionTextareaView,
  type StickerQueryState,
} from "@rede-enois/design-system/domain";

import { usersApi } from "@/lib/api";
import { useDebouncedValue } from "@/lib/use-debounced-value";

import { useAutocompleteDeFigurinhas } from "@/components/emotes/autocomplete-de-figurinhas";
import { EmotePickerDialog } from "@/components/emotes/emote-picker-dialog";

/**
 * Campo de escrita com @menção: a busca de quem mencionar sai daqui (a partir de 2 letras).
 *
 * Também é daqui o `:palavra` do autocomplete de figurinhas: o campo acha o termo sob o cursor e a
 * escolha troca o termo pelo código completo (`:codigo:`) — o mesmo formato do seletor, o único que
 * vira imagem no texto publicado. O menu procura no pacote É Nóis, no catálogo oficial e no da
 * comunidade de uma vez (ver `useAutocompleteDeFigurinhas`).
 *
 * O seletor de figurinhas globais fica no botão que entra na barra do campo (ao lado da formatação,
 * dentro do campo na barra compacta) — ele insere o CÓDIGO na posição do cursor, como qualquer
 * palavra, e o texto continua texto no banco. A inserção e o foco passam pelo `MentionTextareaHandle`:
 * o campo do DS não é um `<textarea>`, e o `insertAtCaret` é quem guarda a seleção enquanto o diálogo
 * está aberto.
 */
export function MentionTextarea({
  emoteInline = false,
  ...props
}: Omit<MentionTextareaProps, "mentionResults" | "onMentionQueryChange" | "stickerSuggestions"> & {
  /** Sticker button at the end of the field (compact composer) instead of above it. */
  emoteInline?: boolean;
}) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [field, setField] = useState<MentionTextareaHandle | null>(null);
  // A menção é digitada letra a letra dentro do texto; a busca espera a pausa para sair.
  const debouncedMentionQuery = useDebouncedValue(mentionQuery, 250);

  const { data: results = [] } = useQuery({
    queryKey: ["users", "search", debouncedMentionQuery],
    queryFn: ({ signal }) => usersApi.search(debouncedMentionQuery, signal),
    enabled: debouncedMentionQuery.length >= 2,
  });

  // A figurinha escolhida no `:` entra pelo caminho do próprio campo: o `:termo` sai junto.
  const { sugestoes } = useAutocompleteDeFigurinhas((codigo, consulta: StickerQueryState) => {
    field?.replaceStickerQuery(codigo, consulta);
  });

  const insertEmote = (emoteCode: string) => {
    // `:KEKW:` is the only format that becomes a sticker in new text (issue #556).
    field?.insertAtCaret(`:${emoteCode}:`);
  };

  // Ao fechar, o cursor volta para o campo: quem escolheu a figurinha continua escrevendo.
  const closeEmote = (open: boolean) => {
    if (!open) field?.focus();
  };

  const emotePicker = <EmotePickerDialog onOpenChange={closeEmote} onSelect={insertEmote} />;

  return (
    <MentionTextareaView
      ref={setField}
      {...props}
      mentionResults={results}
      onMentionQueryChange={setMentionQuery}
      stickerSuggestions={sugestoes}
      toolbarActions={emoteInline ? undefined : emotePicker}
      trailingButtons={emoteInline ? emotePicker : undefined}
    />
  );
}
