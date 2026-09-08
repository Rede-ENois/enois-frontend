import { useConversationMessagesController } from "@/utils/components/messages/use-conversation-messages-controller";

import { ConversationMessageList } from "@/components/conversation-message-list";

export function ConversationMessages() {
  const messages = useConversationMessagesController();

  return (
    <ConversationMessageList
      items={messages.items}
      showEmptyState={messages.showEmptyState}
      otherProfileUsername={messages.otherProfileUsername}
      otherAvatar={messages.otherAvatar}
      otherName={messages.otherName}
      messagesEndRef={messages.messagesEndRef}
    />
  );
}
