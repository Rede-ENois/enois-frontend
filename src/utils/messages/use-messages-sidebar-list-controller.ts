import { useConversations } from "@/lib/messages/use-conversations";

export function useMessagesSidebarListController() {
  const conversations = useConversations();

  return {
    conversations,
    showEmptyState: conversations.length === 0,
  };
}
