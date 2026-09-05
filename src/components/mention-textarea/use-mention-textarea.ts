import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { type UserSearchResult, usersApi } from "@/lib/api";
import {
  addUnique,
  emptyMentionContext,
  getMentionContext,
  insertMention,
  moveCircularIndex,
} from "@/utils/mentions";

export function useMentionTextarea(
  value: string,
  onChange: (value: string, mentionedUserIds: string[]) => void,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  const { data: results = [] } = useQuery({
    queryKey: ["users", "search", mentionQuery],
    queryFn: () => usersApi.search(mentionQuery),
    enabled: mentionQuery.length >= 2,
  });

  useEffect(() => setSelectedIndex(0), [results.length]);

  const clearMention = () => {
    setMentionQuery(emptyMentionContext.query);
    setMentionIndex(emptyMentionContext.index);
  };

  const handleInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const element = event.currentTarget;
    const context = getMentionContext(element.value, element.selectionStart);
    setMentionQuery(context.query);
    setMentionIndex(context.index);
    onChange(element.value, mentionedUserIds);
  };

  const handleSelect = (user: UserSearchResult) => {
    if (mentionIndex === -1) return;
    const insertion = insertMention(value, { query: mentionQuery, index: mentionIndex }, user.username);
    const nextIds = addUnique(mentionedUserIds, user.id);

    clearMention();
    setMentionedUserIds(nextIds);
    onChange(insertion.value, nextIds);
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(insertion.cursor, insertion.cursor);
      textareaRef.current?.focus();
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionIndex === -1 || results.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setSelectedIndex((index) => moveCircularIndex(index, direction, results.length));
      return;
    }
    if (event.key === "Tab" || event.key === "Enter") {
      event.preventDefault();
      handleSelect(results[selectedIndex]);
      return;
    }
    if (event.key === "Escape") clearMention();
  };

  return {
    textareaRef,
    mentionQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    handleInput,
    handleKeyDown,
    handleSelect,
  };
}
