import { useMessagesStore } from "@/stores/messages.store";
import { createMessagesSidebarViewModel } from "@/utils/components/messages/create-messages-sidebar-view-model";

import { useConversations } from "@/lib/use-conversations";

export function useMessagesSidebarController() {
  const activeId = useMessagesStore((state) => state.activeConversationId);
  const showSearch = useMessagesStore((state) => state.newConversationSearchOpen);
  const conversations = useConversations();

  return createMessagesSidebarViewModel(activeId, conversations, showSearch);
}
