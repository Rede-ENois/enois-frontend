import type { ConversationMessagesProps } from "@/types/components/messages/conversation-messages-props";

import { useConversationMessagesController } from "@/utils/components/messages/use-conversation-messages-controller";

import { ConversationMessageList } from "@/components/conversation-message-list";

export function ConversationMessages(props: ConversationMessagesProps) {
  const messages = useConversationMessagesController(props);

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
