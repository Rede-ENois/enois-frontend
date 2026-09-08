import { createContext } from "react";

import type { useConversationMessagesController } from "@/utils/messages/use-conversation-messages-controller";

export const ConversationMessagesContext = createContext<ReturnType<
  typeof useConversationMessagesController
> | null>(null);
