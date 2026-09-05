import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { type UserSearchResult, usersApi } from "@/lib/api";
import {
  addUnique,
  emptyMentionContext,
  getMentionContext,
  insertMention,
  moveCircularIndex,
} from "@/utils/mentions";

import { UserAvatar } from "@/components/user-avatar";

interface Props {
  value: string;
  onChange: (value: string, mentionedUserIds: string[]) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  rows?: number;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  maxLength,
  rows,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
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

  const updateMention = (text: string, cursor: number) => {
    const context = getMentionContext(text, cursor);
    setMentionQuery(context.query);
    setMentionIndex(context.index);
  };

  const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const element = event.currentTarget;
    const next = element.value;
    updateMention(next, element.selectionStart);
    onChange(next, mentionedIds);
  };

  const pick = (user: UserSearchResult) => {
    if (mentionIndex === -1) return;

    const context = { query: mentionQuery, index: mentionIndex };
    const insertion = insertMention(value, context, user.username);
    const ids = addUnique(mentionedIds, user.id);

    setMentionQuery(emptyMentionContext.query);
    setMentionIndex(emptyMentionContext.index);
    setMentionedIds(ids);
    onChange(insertion.value, ids);

    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(insertion.cursor, insertion.cursor);
      textareaRef.current?.focus();
    });
  };

  const handleKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionIndex === -1 || results.length === 0) return;

    const keyActions: Partial<
      Record<string, { preventDefault: boolean; run: () => void }>
    > = {
      ArrowDown: {
        preventDefault: true,
        run: () => setSelectedIdx((index) => moveCircularIndex(index, 1, results.length)),
      },
      ArrowUp: {
        preventDefault: true,
        run: () => setSelectedIdx((index) => moveCircularIndex(index, -1, results.length)),
      },
      Tab: { preventDefault: true, run: () => pick(results[selectedIdx]) },
      Enter: { preventDefault: true, run: () => pick(results[selectedIdx]) },
      Escape: {
        preventDefault: false,
        run: () => {
          setMentionQuery(emptyMentionContext.query);
          setMentionIndex(emptyMentionContext.index);
        },
      },
    };

    const action = keyActions[event.key];
    if (!action) return;
    if (action.preventDefault) event.preventDefault();
    action.run();
  };

  return (
    <div className="relative min-w-0 flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onInput={handleInput}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className={`w-full resize-none ${className}`}
        maxLength={maxLength}
        rows={rows}
      />
      {mentionQuery.length >= 2 && results.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          {results.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                pick(user);
              }}
              onMouseEnter={() => setSelectedIdx(index)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                index === selectedIdx ? "bg-muted" : "hover:bg-muted"
              }`}
            >
              <UserAvatar src={user.avatar} alt={user.name} className="h-8 w-8 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
