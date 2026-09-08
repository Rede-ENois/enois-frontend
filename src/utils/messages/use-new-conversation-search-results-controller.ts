import { useMessagesStore } from "@/stores/messages.store";
import { useConversationSearchResults } from "@/utils/messages/use-conversation-search-results";

export function useNewConversationSearchResultsController() {
  const query = useMessagesStore((state) => state.newConversationSearchQuery);
  const users = useConversationSearchResults(query);

  return {
    visible: Boolean(query),
    users,
    showEmptyState: users.length === 0,
  };
}
