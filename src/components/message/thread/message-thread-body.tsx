import { texts } from "@/texts";
import type { MessageListProps } from "@/types/components/message/message-list-props";

import { MessageList } from "./message-list";

export function MessageThreadBody({ messages, currentUserId, otherUser, otherUserId }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
      {messages.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{texts.messages.noMessages}</p>
      ) : (
        <MessageList messages={messages} currentUserId={currentUserId} otherUser={otherUser} otherUserId={otherUserId} />
      )}
    </div>
  );
}
