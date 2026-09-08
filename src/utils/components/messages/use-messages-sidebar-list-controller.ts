import { useConversations } from "@/lib/use-conversations";

export function useMessagesSidebarListController() {
  const conversations = useConversations();

  return {
    conversations,
    showEmptyState: conversations.length === 0,
  };
}
