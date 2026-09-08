import { useContext } from "react";

import { ConversationHeaderContext } from "@/utils/messages/conversation-header-context";

export function useConversationHeaderContext() {
  const context = useContext(ConversationHeaderContext);

  if (!context) {
    throw new Error(
      "Conversation header components must be rendered inside ConversationHeaderProvider",
    );
  }

  return context;
}
