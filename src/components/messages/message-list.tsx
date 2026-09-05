import { useEffect, useRef } from "react";

import { Link } from "@tanstack/react-router";

import type { Message, Profile } from "@/lib/api";
import { formatRelativeTime } from "@/utils/time";

import { UserAvatar } from "@/components/user-avatar";

const messageStyles = {
  mine: {
    row: "justify-end",
    bubble: "rounded-br-md bg-primary text-primary-foreground",
    time: "text-primary-foreground/70",
  },
  theirs: {
    row: "justify-start",
    bubble: "rounded-bl-md bg-card text-foreground",
    time: "text-muted-foreground",
  },
} as const;

type MessageListProps = {
  messages: Message[];
  currentUserId: string;
  otherUser?: Profile;
  otherUserId: string;
};

export function MessageList({ messages, currentUserId, otherUser, otherUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const ownership = message.from === currentUserId ? "mine" : "theirs";
        const styles = messageStyles[ownership];

        return (
          <div key={message.id} className={`flex items-end gap-2 ${styles.row}`}>
            {ownership === "theirs" && (
              <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherUserId }}>
                <UserAvatar
                  src={otherUser?.avatar}
                  alt={otherUser?.name}
                  className="mb-1 h-7 w-7 shrink-0"
                />
              </Link>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${styles.bubble}`}>
              <p className="break-words">{message.text}</p>
              <p className={`mt-1 text-[10px] ${styles.time}`}>{formatRelativeTime(message.time)}</p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
