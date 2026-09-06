import type { FormEventHandler } from "react";

import type { Conversation, Message, Profile } from "@/lib/api";
import { texts } from "@/texts";
import { getOtherParticipantId } from "@/utils/messages";

import { MessageThreadBody } from "./thread/message-thread-body";
import { MessageThreadComposer } from "./thread/message-thread-composer";
import { MessageThreadHeader } from "./thread/message-thread-header";

type MessageThreadProps = {
  conversation: Conversation | null;
  otherUser?: Profile;
  currentUserId: string;
  messages: Message[];
  messageText: string;
  isSending: boolean;
  onBack: () => void;
  onTextChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function MessageThread({
  conversation,
  otherUser,
  currentUserId,
  messages,
  messageText,
  isSending,
  onBack,
  onTextChange,
  onSubmit,
}: MessageThreadProps) {
  if (!conversation) {
    return <div className="hidden min-h-0 flex-col md:flex"><div className="flex h-full items-center justify-center"><p className="text-sm text-muted-foreground">{texts.messages.selectConversation}</p></div></div>;
  }

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;
  const otherUserId = getOtherParticipantId(conversation.participantIds, currentUserId) ?? currentUserId;

  return (
    <div className="flex min-h-0 flex-col">
      <MessageThreadHeader title={title} otherUser={otherUser} otherUserId={otherUserId} onBack={onBack} />
      <MessageThreadBody messages={messages} currentUserId={currentUserId} otherUser={otherUser} otherUserId={otherUserId} />
      <MessageThreadComposer
        messageText={messageText}
        isSending={isSending}
        onTextChange={onTextChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}
