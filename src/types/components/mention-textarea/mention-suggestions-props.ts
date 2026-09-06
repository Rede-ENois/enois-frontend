import type { UserSearchResult } from "@/types/application/user/user-search-result";

export type MentionSuggestionsProps = {
  results: UserSearchResult[];
  selectedIndex: number;
  onSelect: (user: UserSearchResult) => void;
  onHover: (index: number) => void;
};
