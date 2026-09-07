import type { MouseEvent } from "react";

import type { UserSearchResult } from "@/types/application/user/user-search-result";

export function createMentionSuggestions(
  results: UserSearchResult[],
  selectedIndex: number,
  select: (index: number) => void,
  pick: (user: UserSearchResult) => void,
) {
  return results.map((user, index) => ({
    user,
    selected: index === selectedIndex,
    onMouseEnter: () => select(index),
    onMouseDown: (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      pick(user);
    },
  }));
}
