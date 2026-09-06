import type { NetworkUser } from "@/lib/api";

export type ContactSearchProps = {
  searchQuery: string;
  searchResults: NetworkUser[];
  onSearchQueryChange: (value: string) => void;
  onCreateConversation: (userId: string) => void;
};
