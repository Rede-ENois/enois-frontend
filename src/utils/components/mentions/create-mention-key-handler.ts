import type { KeyboardEvent } from "react";

import type { UserSearchResult } from "@/types/application/user/user-search-result";

export function createMentionKeyHandler(
  mentionIndex: number,
  results: UserSearchResult[],
  selectedIndex: number,
  next: () => void,
  previous: () => void,
  pick: (user: UserSearchResult) => void,
  close: () => void,
) {
  return (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionIndex === -1 || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      next();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      previous();
      return;
    }
    if (event.key === "Tab" || event.key === "Enter") {
      event.preventDefault();
      pick(results[selectedIndex]);
      return;
    }
    if (event.key === "Escape") close();
  };
}
