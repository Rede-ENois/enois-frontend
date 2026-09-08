import { useMessagesStore } from "@/stores/messages.store";

export function useMessagesSidebarController() {
  const activeConversationId = useMessagesStore((state) => state.activeConversationId);

  return {
    sidebarClassName: activeConversationId ? "hidden md:flex" : "flex",
  };
}
