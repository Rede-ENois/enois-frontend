import { createContext } from "react";

import type { ConversationHeaderContextValue } from "@/types/components/messages/conversation-header-context-value";

export const ConversationHeaderContext = createContext<ConversationHeaderContextValue | null>(null);
