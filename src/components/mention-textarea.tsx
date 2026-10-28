import { useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import {
  type MentionTextareaProps,
  MentionTextarea as MentionTextareaView,
} from "@rede-enois/design-system/domain";
import { Button } from "@rede-enois/design-system/ui";
import { Smile } from "lucide-react";

import { usersApi } from "@/lib/api";

import { EmotePickerDialog } from "@/components/emotes/emote-picker-dialog";

/**
 * Campo de escrita com @menção: a busca de quem mencionar sai daqui (a partir de 2 letras).
 *
 * Também é daqui o seletor de figurinhas globais (BTTV/FFZ): o botão fica acima do campo e
 * insere o CÓDIGO na posição do cursor, como qualquer palavra — o texto continua texto no banco.
 */
export function MentionTextarea(
  props: Omit<MentionTextareaProps, "mentionResults" | "onMentionQueryChange">,
) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [emoteOpen, setEmoteOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Menções confirmadas até agora: o seletor não mexe na lista, mas o contrato do campo devolve
  // valor + ids e a lista precisa continuar valendo.
  const mentionIds = useRef<string[]>([]);

  const { data: results = [] } = useQuery({
    queryKey: ["users", "search", mentionQuery],
    queryFn: () => usersApi.search(mentionQuery),
    enabled: mentionQuery.length >= 2,
  });

  const insertEmote = (code: string) => {
    const value = props.value;
    const textarea = containerRef.current?.querySelector("textarea");
    // O seletor é um diálogo: o campo perde o foco, mas a seleção continua guardada no textarea.
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    // O código precisa ficar separado por espaço para ser reconhecido na leitura do texto.
    const prefix = before && !/\s$/.test(before) ? " " : "";
    const suffix = after && !/^\s/.test(after) ? " " : "";
    const next = `${before}${prefix}${code}${suffix}${after}`;
    if (props.maxLength !== undefined && next.length > props.maxLength) return;

    const caret = before.length + prefix.length + code.length + suffix.length;
    props.onChange(next, mentionIds.current);

    // Sem `focus()`: o diálogo continua aberto para escolher mais de uma figurinha.
    requestAnimationFrame(() => {
      const node = containerRef.current?.querySelector("textarea");
      node?.setSelectionRange(caret, caret);
    });
  };

  return (
    <div ref={containerRef} className="min-w-0 flex-1">
      {props.toolbar && (
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
        {...props}
        onChange={(value, ids) => {
          mentionIds.current = ids;
          props.onChange(value, ids);
        }}
        mentionResults={results}
        onMentionQueryChange={setMentionQuery}
      />
      <EmotePickerDialog
        open={emoteOpen}
        onOpenChange={(open) => {
          setEmoteOpen(open);
          // Ao fechar, o cursor volta para o campo: quem escolheu a figurinha continua escrevendo.
          if (!open)
            requestAnimationFrame(() => containerRef.current?.querySelector("textarea")?.focus());
        }}
        onSelect={insertEmote}
      />
    </div>
  );
}
