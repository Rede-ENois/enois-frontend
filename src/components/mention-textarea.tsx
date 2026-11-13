import { useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import {
  type MentionTextareaHandle,
  type MentionTextareaProps,
  MentionTextarea as MentionTextareaView,
} from "@rede-enois/design-system/domain";
import { Button } from "@rede-enois/design-system/ui";
import { Smile } from "lucide-react";

import { usersApi } from "@/lib/api";
import { useDebouncedValue } from "@/lib/use-debounced-value";

import { EmotePickerDialog } from "@/components/emotes/emote-picker-dialog";

/**
 * Campo de escrita com @menção: a busca de quem mencionar sai daqui (a partir de 2 letras).
 *
 * Também é daqui o seletor de figurinhas globais (BTTV/FFZ): o botão fica acima do campo e
 * insere o CÓDIGO na posição do cursor, como qualquer palavra — o texto continua texto no banco.
 * A inserção e o foco passam pelo `MentionTextareaHandle`: o campo do DS 0.33 não é um
 * `<textarea>`, e o `insertAtCaret` é quem guarda a seleção enquanto o diálogo está aberto.
 */
export function MentionTextarea({
  emoteInline = false,
  ...props
}: Omit<MentionTextareaProps, "mentionResults" | "onMentionQueryChange"> & {
  /** Sticker button at the end of the field (compact composer) instead of above it. */
  emoteInline?: boolean;
}) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [emoteOpen, setEmoteOpen] = useState(false);
  const fieldRef = useRef<MentionTextareaHandle>(null);
  // A menção é digitada letra a letra dentro do texto; a busca espera a pausa para sair.
  const debouncedMentionQuery = useDebouncedValue(mentionQuery, 250);

  const { data: results = [] } = useQuery({
    queryKey: ["users", "search", debouncedMentionQuery],
    queryFn: ({ signal }) => usersApi.search(debouncedMentionQuery, signal),
    enabled: debouncedMentionQuery.length >= 2,
  });

  const insertEmote = (emoteCode: string) => {
    // `:KEKW:` is the only format that becomes a sticker in new text (issue #556).
    fieldRef.current?.insertAtCaret(`:${emoteCode}:`);
  };

  return (
    <div className={emoteInline ? "flex min-w-0 flex-1 items-end gap-1" : "min-w-0 flex-1"}>
      {props.toolbar && !emoteInline && (
        <div className="mb-1 flex items-center justify-end">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 gap-1 rounded-full px-2 text-[11px] font-normal text-text-subtle"
            onClick={() => setEmoteOpen(true)}
          >
            <Smile className="h-3.5 w-3.5" />

            <>{texts.emotes.button}</>
          </Button>
        </div>
      )}

      <MentionTextareaView
        ref={fieldRef}
        {...props}
        mentionResults={results}
        onMentionQueryChange={setMentionQuery}
      />
      {emoteInline && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 rounded-full text-text-subtle hover:text-primary"
          aria-label={texts.emotes.button}
          title={texts.emotes.button}
          onClick={() => setEmoteOpen(true)}
        >
          <Smile className="h-4 w-4" />
        </Button>
      )}
      <EmotePickerDialog
        open={emoteOpen}
        onOpenChange={(open) => {
          setEmoteOpen(open);
          // Ao fechar, o cursor volta para o campo: quem escolheu a figurinha continua escrevendo.
          if (!open) fieldRef.current?.focus();
        }}
        onSelect={insertEmote}
      />
    </div>
  );
}
