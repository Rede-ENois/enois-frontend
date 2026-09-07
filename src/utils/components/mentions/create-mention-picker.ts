import type { RefObject } from "react";

import type { UserSearchResult } from "@/types/application/user/user-search-result";

export function createMentionPicker(
  value: string,
  query: string,
  mentionIndex: number,
  mentionedIds: string[],
  setMentionedIds: (ids: string[]) => void,
  clearMention: () => void,
  onChange: (value: string, mentionedUserIds: string[]) => void,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
) {
  return (user: UserSearchResult) => {
    if (mentionIndex === -1) return;

    const before = value.slice(0, mentionIndex);
    const after = value.slice(mentionIndex + query.length + 1);
    const next = `${before}@${user.username} ${after}`;
    const ids = mentionedIds.includes(user.id) ? mentionedIds : [...mentionedIds, user.id];

    clearMention();
    setMentionedIds(ids);
    onChange(next, ids);

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const position = before.length + user.username.length + 2;
      textareaRef.current.setSelectionRange(position, position);
      textareaRef.current.focus();
    });
  };
}
