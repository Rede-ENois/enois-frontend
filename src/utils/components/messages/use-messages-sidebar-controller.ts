import { useConversations } from "@/lib/use-conversations";
import { useMessagesStore } from "@/stores/messages.store";

import { createMessagesSidebarViewModel } from "@/utils/components/messages/create-messages-sidebar-view-model";

export function useMessagesSidebarController() {
  const activeId = useMessagesStore((state) => state.activeConversationId);
  const showSearch = useMessagesStore((state) => state.newConversationSearchOpen);
  const conversations = useConversations();

  return createMessagesSidebarViewModel(activeId, conversations, showSearch);
}
