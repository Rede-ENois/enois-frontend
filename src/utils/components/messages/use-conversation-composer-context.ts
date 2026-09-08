import { useContext } from "react";

import { ConversationComposerContext } from "@/utils/components/messages/conversation-composer-context";

export function useConversationComposerContext() {
  const context = useContext(ConversationComposerContext);

  if (!context) {
    throw new Error("Conversation composer components must be rendered inside ConversationComposerProvider");
  }

  return context;
}
