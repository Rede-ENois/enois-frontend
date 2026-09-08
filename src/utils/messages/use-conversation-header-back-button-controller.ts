import { useMessagesStore } from "@/stores/messages.store";

export function useConversationHeaderBackButtonController() {
  return {
    clearConversation: useMessagesStore((state) => state.clearConversation),
  };
}
