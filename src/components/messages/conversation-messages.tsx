import { texts } from "@/texts";
import { useConversationMessagesContext } from "@/utils/components/messages/use-conversation-messages-context";

import { ConversationMessageItem } from "@/components/messages/conversation-message-item";

export function ConversationMessages() {
  const { items, showEmptyState, messagesEndRef } = useConversationMessagesContext();

  return (
    <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
      <div className="space-y-3">
        {showEmptyState ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {texts.messages.noMessages}
          </p>
        ) : (
          items.map((item) => <ConversationMessageItem key={item.message.id} item={item} />)
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
