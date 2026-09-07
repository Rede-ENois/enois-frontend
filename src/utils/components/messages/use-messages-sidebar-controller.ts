import type { MessagesSidebarProps } from "@/types/components/messages/messages-sidebar-props";

import { useConversations } from "@/lib/use-conversations";

import { createMessagesSidebarViewModel } from "@/utils/components/messages/create-messages-sidebar-view-model";
import { useConversationReadAction } from "@/utils/components/messages/use-conversation-read-action";
import { useMessagesSidebarSearch } from "@/utils/components/messages/use-messages-sidebar-search";

export function useMessagesSidebarController({ activeId, onSelect }: MessagesSidebarProps) {
  const conversations = useConversations();
  const markAsRead = useConversationReadAction();
  const search = useMessagesSidebarSearch();
  const view = createMessagesSidebarViewModel(
    activeId,
    conversations,
    search.showSearch,
    onSelect,
    markAsRead,
  );

  return {
    ...search,
    ...view,
  };
}
