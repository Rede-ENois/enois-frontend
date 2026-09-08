import { createContext } from "react";

import type { useConversationComposerController } from "@/utils/messages/use-conversation-composer-controller";

export const ConversationComposerContext = createContext<ReturnType<
  typeof useConversationComposerController
> | null>(null);
