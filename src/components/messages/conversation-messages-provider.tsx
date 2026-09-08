import { ConversationMessagesContext } from "@/utils/components/messages/conversation-messages-context";
import { useConversationMessagesController } from "@/utils/components/messages/use-conversation-messages-controller";

import { ConversationMessages } from "@/components/messages/conversation-messages";

export function ConversationMessagesProvider() {
  const controller = useConversationMessagesController();

  return (
    <ConversationMessagesContext.Provider value={controller}>
      <ConversationMessages />
    </ConversationMessagesContext.Provider>
  );
}
