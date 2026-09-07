import { texts } from "@/texts";
import type { ConversationMessageListProps } from "@/types/components/messages/conversation-message-list-props";

import { ConversationMessageItem } from "@/components/conversation-message-item";

export function ConversationMessageList({
  items,
  showEmptyState,
  otherProfileUsername,
  otherAvatar,
  otherName,
  messagesEndRef,
}: ConversationMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
      <div className="space-y-3">
        {showEmptyState ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {texts.messages.noMessages}
          </p>
        ) : (
          items.map((item) => (
            <ConversationMessageItem
              key={item.message.id}
              item={item}
              otherProfileUsername={otherProfileUsername}
              otherAvatar={otherAvatar}
              otherName={otherName}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
