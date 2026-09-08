import { useMessagesStore } from "@/stores/messages/messages.store";
import { texts } from "@/texts";

export function useMessagesSidebarHeaderController() {
  const showSearch = useMessagesStore((state) => state.newConversationSearchOpen);
  const toggleSearch = useMessagesStore((state) => state.toggleNewConversationSearch);

  return {
    showSearch,
    toggleSearch,
    searchToggleLabel: showSearch ? texts.messages.back : texts.messages.new,
  };
}
