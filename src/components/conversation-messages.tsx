import { useEffect, useRef } from "react";

import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ConversationMessagesProps } from "@/types/components/messages/conversation-messages-props";
import { formatRelativeTime } from "@/utils/format-relative-time";

import { UserAvatar } from "@/components/user-avatar";

export function ConversationMessages({
  messages,
  currentUserId,
  otherParticipantId,
  otherUser,
}: ConversationMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {texts.messages.noMessages}
          </p>
        ) : (
          messages.map((message) => {
            const isMe = message.from === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
              >
                {!isMe && (
                  <Link
                    to="/perfil/$username"
                    params={{ username: otherUser?.username ?? otherParticipantId ?? "" }}
                  >
                    <UserAvatar
                      src={otherUser?.avatar}
                      alt={otherUser?.name}
                      className="h-7 w-7 shrink-0 mb-1"
                    />
                  </Link>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isMe
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-card text-foreground"
                  }`}
                >
                  <p className="break-words">{message.text}</p>

                  <p
                    className={`mt-1 text-[10px] ${
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {formatRelativeTime(message.time)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
