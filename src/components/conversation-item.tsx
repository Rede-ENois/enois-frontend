import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { profileApi } from "@/lib/api/profile";
import { getCurrentUserId } from "@/lib/current-user";
import { texts } from "@/texts";
import type { ConversationItemProps } from "@/types/components/messages/conversation-item-props";
import { formatRelativeTime } from "@/utils/format-relative-time";

import { UserAvatar } from "@/components/user-avatar";

export function ConversationItem({ conversation, isActive, onSelect }: ConversationItemProps) {
  const currentUserId = getCurrentUserId();
  const otherId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => profileApi.getById(otherId ?? ""),
    enabled: !!otherId,
  });

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;

  return (
    <li>
      <button
        onClick={onSelect}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
          isActive ? "bg-primary-soft" : "hover:bg-muted"
        }`}
      >
        <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherId ?? "" }}>
          <UserAvatar src={otherUser?.avatar} alt={title} className="h-11 w-11 shrink-0" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="truncate text-sm font-medium">{title}</span>
            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
              {conversation.time ? formatRelativeTime(conversation.time) : ""}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {conversation.lastMessage ?? ""}
            </p>
            {conversation.unread > 0 && (
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
