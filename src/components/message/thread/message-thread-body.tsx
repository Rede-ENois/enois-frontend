import { texts } from "@/texts";
import type { MessageThreadBodyProps } from "@/types/components/message/message-thread-body-props";

import { MessageList } from "./message-list";

export function MessageThreadBody({ messages, currentUserId, otherUser, otherUserId }: MessageThreadBodyProps) {
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
