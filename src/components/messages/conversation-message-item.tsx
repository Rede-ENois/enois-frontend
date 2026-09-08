import { Link } from "@tanstack/react-router";

import type { ConversationMessageItemProps } from "@/types/messages/conversation-message-item-props";
import { useConversationMessagesContext } from "@/utils/messages/use-conversation-messages-context";

import { UserAvatar } from "@/components/user-avatar";

export function ConversationMessageItem({ item }: ConversationMessageItemProps) {
  const { otherProfileUsername, otherAvatar, otherName } = useConversationMessagesContext();

  return (
    <div className={`flex items-end gap-2 ${item.rowClassName}`}>
      {item.showAvatar && (
        <Link to="/perfil/$username" params={{ username: otherProfileUsername }}>
          <UserAvatar src={otherAvatar} alt={otherName} className="h-7 w-7 shrink-0 mb-1" />
        </Link>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${item.bubbleClassName}`}
      >
        <p className="break-words">{item.message.text}</p>

        <p className={`mt-1 text-[10px] ${item.timeClassName}`}>{item.timeLabel}</p>
      </div>
    </div>
  );
}
