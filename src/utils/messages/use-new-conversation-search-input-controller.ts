import { useMessagesStore } from "@/stores/messages/messages.store";

export function useNewConversationSearchInputController() {
  const query = useMessagesStore((state) => state.newConversationSearchQuery);
  const setQuery = useMessagesStore((state) => state.setNewConversationSearchQuery);

  return { query, setQuery };
}
