import type { ActiveConversationContentProps } from "@/types/components/messages/active-conversation-content-props";

import { ConversationComposer } from "@/components/conversation-composer";
import { ConversationHeader } from "@/components/conversation-header";
import { ConversationMessages } from "@/components/conversation-messages";

export function ActiveConversationContent({
  conversation,
  messages,
  currentUserId,
  otherParticipantId,
  otherUser,
  onBack,
}: ActiveConversationContentProps) {
  return (
    <>
      <ConversationHeader conversation={conversation} onBack={onBack} />
      <ConversationMessages
        messages={messages}
        currentUserId={currentUserId}
        otherParticipantId={otherParticipantId}
        otherUser={otherUser}
      />
      <ConversationComposer conversationId={conversation.id} />
    </>
  );
}
