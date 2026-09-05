import { Link } from "@tanstack/react-router";

import type { Conversation } from "@/lib/api";
import { texts } from "@/texts";
import { getOtherParticipantId } from "@/utils/messages";
import { formatRelativeTime } from "@/utils/time";

import { UserAvatar } from "@/components/user-avatar";
import type { ConversationWithUser } from "./message-types";

type ConversationListProps = {
  conversations: ConversationWithUser[];
  activeId: string | null;
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
};

export function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <ul className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <li className="p-4 text-center text-sm text-muted-foreground">
          {texts.messages.noConversations}
        </li>
      ) : (
        conversations.map(({ conversation, otherUser }) => {
          const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;
          const otherUserId =
            getOtherParticipantId(conversation.participantIds, currentUserId) ?? currentUserId;

          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelectConversation(conversation)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  conversation.id === activeId ? "bg-primary-soft" : "hover:bg-muted"
                }`}
              >
                <Link
                  to="/perfil/$username"
                  params={{ username: otherUser?.username ?? otherUserId }}
                >
                  <UserAvatar src={otherUser?.avatar} alt={title} className="h-11 w-11 shrink-0" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{title}</span>
                    <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(conversation.time)}
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
        })
      )}
    </ul>
  );
}
