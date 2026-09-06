import type { NetworkUser } from "@/types/application/network/network-user";

export type FeedSidebarSuggestionsProps = {
  suggestions: NetworkUser[];
  onConnectSuggestion: (userId: string) => void;
};
