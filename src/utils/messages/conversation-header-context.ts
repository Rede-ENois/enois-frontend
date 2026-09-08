import { createContext } from "react";

import type { ConversationHeaderContextValue } from "@/types/messages/conversation-header-context-value";

export const ConversationHeaderContext = createContext<ConversationHeaderContextValue | null>(null);
