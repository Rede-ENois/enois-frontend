import { useContext } from "react";

import { ConversationMessagesContext } from "@/utils/messages/conversation-messages-context";

export function useConversationMessagesContext() {
  const context = useContext(ConversationMessagesContext);

  if (!context) {
    throw new Error(
      "Conversation message components must be rendered inside ConversationMessagesProvider",
    );
  }

  return context;
}
