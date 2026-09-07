import type { NewConversationSearchResult } from "@/types/components/messages/new-conversation-search-result";

export type NewConversationSearchResultsProps = {
  visible: boolean;
  showEmptyState: boolean;
  users: NewConversationSearchResult[];
};
