import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { type UserSearchResult, userApi } from "@/lib/api";
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

  const { data: mentionResults = [] } = useQuery({
    queryKey: ["users", "search", mentionQuery],
    queryFn: () => userApi.search(mentionQuery),
    enabled: mentionQuery.length >= 2,
  });

  useEffect(() => setSelectedIndex(0), [mentionResults.length]);

  const clearMention = () => {
    setMentionQuery(emptyMentionContext.query);
    setMentionIndex(emptyMentionContext.index);
  };

  const handleInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const mentionContext = getMentionContext(textarea.value, textarea.selectionStart);
    setMentionQuery(mentionContext.query);
    setMentionIndex(mentionContext.index);
    onChange(textarea.value, mentionedUserIds);
  };

  const handleSelect = (user: UserSearchResult) => {
    if (mentionIndex === -1) return;
    const insertion = insertMention(
      value,
      { query: mentionQuery, index: mentionIndex },
      user.username,
    );
    const nextMentionedUserIds = addUnique(mentionedUserIds, user.id);

    clearMention();
    setMentionedUserIds(nextMentionedUserIds);
    onChange(insertion.value, nextMentionedUserIds);
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(insertion.cursor, insertion.cursor);
      textareaRef.current?.focus();
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionIndex === -1 || mentionResults.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setSelectedIndex((index) => moveCircularIndex(index, direction, mentionResults.length));
      return;
    }
    if (event.key === "Tab" || event.key === "Enter") {
      event.preventDefault();
      handleSelect(mentionResults[selectedIndex]);
      return;
    }
    if (event.key === "Escape") clearMention();
  };

  return {
    textareaRef,
    mentionQuery,
    mentionResults,
    selectedIndex,
    setSelectedIndex,
    handleInput,
    handleKeyDown,
    handleSelect,
  };
}
