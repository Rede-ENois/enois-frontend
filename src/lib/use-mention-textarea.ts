import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useQuery } from "@tanstack/react-query";

import { searchUsers } from "@/lib/api/users";
import type { UserSearchResult } from "@/types/application/user/user-search-result";

export function useMentionTextarea(
  value: string,
  onChange: (value: string, mentionedUserIds: string[]) => void,
) {
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

  const handleInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const element = event.currentTarget;
    const next = element.value;
    updateMention(next, element.selectionStart);
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
        const position = before.length + user.username.length + 2;
        textareaRef.current.setSelectionRange(position, position);
        textareaRef.current.focus();
      }
    });
  };

  const handleKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionIndex === -1 || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIdx((index) => (index + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIdx((index) => (index - 1 + results.length) % results.length);
      return;
    }
    if (event.key === "Tab" || event.key === "Enter") {
      event.preventDefault();
      pick(results[selectedIdx]);
      return;
    }
    if (event.key === "Escape") {
      setMentionQuery("");
      setMentionIndex(-1);
    }
  };

  return {
    textareaRef,
    mentionQuery,
    results,
    selectedIdx,
    setSelectedIdx,
    handleInput,
    handleKey,
    pick,
  };
}
