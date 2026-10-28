import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { UserSearchResult } from "@/types/application/user/user-search-result";
import type { Props } from "@/types/components/mention-textarea/props";
import type { MentionListSide } from "@/types/lib/mentions/list-placement";
import type { RichTextFormat } from "@/types/lib/rich-text/rich-text-format";
import { UserAvatar } from "@rede-enois/design-system/domain";
import { CharCounter } from "@rede-enois/design-system/ui";

import { usersApi } from "@/lib/api";
import {
  MENTION_LIST_GAP,
  MENTION_LIST_MAX_HEIGHT,
  mentionListSide,
  mentionListSpaceAbove,
} from "@/lib/mentions/list-placement";
import { applyFormat } from "@/lib/rich-text/apply-format";
import { insertSnippet } from "@/lib/rich-text/insert-snippet";

import { RichTextToolbar } from "@/components/rich-text-toolbar";

/** Altura mínima da caixa, em linhas de texto, para dar espaço de revisar o que foi escrito. */
const MIN_ROWS = 4;

/**
 * O primeiro `<header>` da página pode ser o de um post. O que cobre a busca é o sticky do topo.
 */
function stickyHeaderBottom(node: HTMLElement): number {
  const header = node.ownerDocument.querySelector("header.sticky");
  return header?.getBoundingClientRect().bottom ?? 0;
}

/** Atalhos de teclado da formatacao; `mod` e Ctrl no Windows/Linux e Cmd no Mac. */
const SHORTCUTS: Record<string, RichTextFormat> = {
  b: "bold",
  i: "italic",
  e: "code",
  k: "link",
};

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  maxLength,
  showCounter = true,
  rows,
  toolbar = false,
  onPasteImages,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [listSide, setListSide] = useState<MentionListSide>("above");

  // Auto-expansao: cresce com o texto ate o teto (240px); dali em diante rola dentro.
  // Layout, não effect: a altura tem de estar aplicada antes da medida da lista, no mesmo frame.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);

  const { data: results = [] } = useQuery({
    queryKey: ["users", "search", mentionQuery],
    queryFn: () => usersApi.search(mentionQuery),
    enabled: mentionQuery.length >= 2,
  });

  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length]);

  const listOpen = mentionQuery.length >= 2 && results.length > 0;

  // Acompanha o texto: cresce conforme você escreve e encolhe ao apagar, nunca
  // ficando menor que MIN_ROWS linhas — assim dá pra reler e editar o que digitou.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const styles = getComputedStyle(el);
    const parsedLineHeight = parseFloat(styles.lineHeight);
    const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : 20;
    const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const minHeight = MIN_ROWS * lineHeight + verticalPadding;

    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  }, [value]);

  // O scroll não borbulha: sem capture, rolar um diálogo não reavalia o lado.
  // Declarado depois dos efeitos de altura para medir o campo já crescido.
  useLayoutEffect(() => {
    if (!listOpen) return;

    const measure = () => {
      const node = rootRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const next = mentionListSide(
        mentionListSpaceAbove(rect.top, stickyHeaderBottom(node)),
        window.innerHeight - rect.bottom,
        MENTION_LIST_MAX_HEIGHT + MENTION_LIST_GAP,
      );
      setListSide((current) => (current === next ? current : next));
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [listOpen, value]);

  // O campo continua a edição da menção. Fora da lista e do campo, o clique dispensa
  // o painel — senão ele fica por cima de Tipo, abas e do resto da página.
  useEffect(() => {
    if (!listOpen) return;

    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (listRef.current?.contains(target)) return;
      if (textareaRef.current?.contains(target)) return;
      setMentionQuery("");
      setMentionIndex(-1);
    };

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [listOpen]);

  const updateMention = (text: string, cursor: number) => {
    const before = text.slice(0, cursor);
    const at = before.lastIndexOf("@");
    if (at === -1) {
      setMentionQuery("");
      setMentionIndex(-1);
      return;
    }
    const term = before.slice(at + 1);
    if (term.includes(" ") || term.includes("\n") || term.length === 0) {
      setMentionQuery("");
      setMentionIndex(-1);
      return;
    }
    setMentionQuery(term);
    setMentionIndex(at);
  };

  const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const next = el.value;
    const cursor = el.selectionStart;
    updateMention(next, cursor);
    onChange(next, mentionedIds);
  };

  const pick = (user: UserSearchResult) => {
    if (mentionIndex === -1) return;
    const before = value.slice(0, mentionIndex);
    const after = value.slice(mentionIndex + mentionQuery.length + 1);
    const next = `${before}@${user.username} ${after}`;
    setMentionQuery("");
    setMentionIndex(-1);
    const ids = mentionedIds.includes(user.id) ? mentionedIds : [...mentionedIds, user.id];
    setMentionedIds(ids);
    onChange(next, ids);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = before.length + user.username.length + 2;
        textareaRef.current.setSelectionRange(pos, pos);
        textareaRef.current.focus();
      }
    });
  };

  /** Formata o trecho selecionado e devolve o foco/cursor para dentro do campo. */
  const formatSelection = (format: RichTextFormat) => {
    const element = textareaRef.current;
    if (!element) return;

    const result = applyFormat(value, element.selectionStart, element.selectionEnd, format);
    onChange(result.value, mentionedIds);

    // O valor volta pelo `value` (componente controlado): a selecao so pode ser reposta depois
    // do proximo paint, quando o textarea ja tem o texto novo.
    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  /**
   * Emoji do seletor: entra na posição do cursor, substituindo o que estiver selecionado (o mesmo
   * contrato das formatações). O campo não perde o foco ao escolher, então a posição é a que a
   * pessoa estava vendo. Passar do limite não insere — o contador de caracteres já avisa.
   */
  const insertEmoji = (emoji: string) => {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? start;
    const result = insertSnippet(value, start, end, emoji);
    if (maxLength !== undefined && result.value.length > maxLength) return;

    onChange(result.value, mentionedIds);

    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (toolbar && (e.ctrlKey || e.metaKey) && !e.altKey) {
      const shortcut = SHORTCUTS[e.key.toLowerCase()];
      if (shortcut) {
        e.preventDefault();
        formatSelection(shortcut);
        return;
      }
    }

    if (mentionIndex === -1 || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => (i + 1) % results.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => (i - 1 + results.length) % results.length);
      return;
    }
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      pick(results[selectedIdx]);
      return;
    }
    if (e.key === "Escape") {
      setMentionQuery("");
      setMentionIndex(-1);
    }
  };

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      {toolbar && (
        <RichTextToolbar
          label={texts.posts.formatting.toolbar}
          onFormat={formatSelection}
          onEmoji={insertEmoji}
          className="mb-1.5"
        />
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onInput={handleInput}
        onKeyDown={handleKey}
        onPaste={(event) => {
          if (!onPasteImages) return;
          const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
            file.type.startsWith("image/"),
          );
          if (files.length === 0) return;
          event.preventDefault();
          onPasteImages(files);
        }}
        placeholder={placeholder}
        className={`max-h-[240px] w-full resize-none overflow-y-auto ${className}`}
        maxLength={maxLength}
        rows={rows}
      />

      {/* Mesmo contador de todo campo com limite (Input/Textarea usam o CharCounter via withCounter):
          um so lugar decide o aviso de "perto do limite" e o "limite atingido". */}
      {showCounter && maxLength !== undefined && (
        <CharCounter length={value.length} max={maxLength} />
      )}

      {/* `bottom-full` fixo cobria a busca do /feed: o composer fica sob o header. */}
      {listOpen && (
        <div
          ref={listRef}
          className={`absolute left-0 right-0 z-50 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg ${
            listSide === "below" ? "top-full mt-1" : "bottom-full mb-1"
          }`}
        >
          {results.map((user, i) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(user);
              }}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                i === selectedIdx ? "bg-muted" : "hover:bg-muted"
              }`}
            >
              <UserAvatar src={user.avatar} alt={user.name} className="h-8 w-8 shrink-0" />

              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>

                <p className="truncate text-xs text-muted-foreground">
                  {texts.mentions.username(user.username)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
