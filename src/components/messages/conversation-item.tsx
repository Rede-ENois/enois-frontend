import { Link } from "@tanstack/react-router";

import type { ConversationItemProps } from "@/types/messages/conversation-item-props";
import { useConversationItemController } from "@/utils/messages/use-conversation-item-controller";

import { UserAvatar } from "@/components/user-avatar";

export function ConversationItem({ conversation }: ConversationItemProps) {
  const {
    isActive,
    otherUser,
    title,
    profileUsername,
    timeLabel,
    lastMessage,
    unreadCount,
    showUnread,
    select,
  } = useConversationItemController(conversation);

  return (
    <li>
      <button
        onClick={select}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
          isActive ? "bg-primary-soft" : "hover:bg-muted"
        }`}
      >
        <Link to="/perfil/$username" params={{ username: profileUsername }}>
          <UserAvatar src={otherUser?.avatar} alt={title} className="h-11 w-11 shrink-0" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="truncate text-sm font-medium">{title}</span>

            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{timeLabel}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">{lastMessage}</p>
            {showUnread && (
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
