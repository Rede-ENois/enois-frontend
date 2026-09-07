import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ConversationMessagesProps } from "@/types/components/messages/conversation-messages-props";

import { useConversationMessagesController } from "@/utils/components/messages/use-conversation-messages-controller";

import { UserAvatar } from "@/components/user-avatar";

export function ConversationMessages(props: ConversationMessagesProps) {
  const {
    messagesEndRef,
    showEmptyState,
    otherProfileUsername,
    otherAvatar,
    otherName,
    items,
  } = useConversationMessagesController(props);

  return (
    <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
      <div className="space-y-3">
        {showEmptyState ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {texts.messages.noMessages}
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.message.id}
              className={`flex items-end gap-2 ${item.rowClassName}`}
            >
              {item.showAvatar && (
                <Link to="/perfil/$username" params={{ username: otherProfileUsername }}>
                  <UserAvatar
                    src={otherAvatar}
                    alt={otherName}
                    className="h-7 w-7 shrink-0 mb-1"
                  />
                </Link>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${item.bubbleClassName}`}
              >
                <p className="break-words">{item.message.text}</p>

                <p className={`mt-1 text-[10px] ${item.timeClassName}`}>{item.timeLabel}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
