import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { searchUsers } from "@/lib/api/users";
import { texts } from "@/texts";
import type { UserSearchResult } from "@/types/application/user/user-search-result";
import type { Props } from "@/types/components/mention-textarea/props";

import { UserAvatar } from "@/components/user-avatar";

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
    queryFn: () => searchUsers(mentionQuery),
    enabled: mentionQuery.length >= 2,
  });

  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length]);

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

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
