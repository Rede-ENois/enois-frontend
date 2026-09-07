import { texts } from "@/texts";
import type { ActiveConversationProps } from "@/types/components/messages/active-conversation-props";

import { useActiveConversationController } from "@/utils/components/messages/use-active-conversation-controller";

import { ConversationComposer } from "@/components/conversation-composer";
import { ConversationHeader } from "@/components/conversation-header";
import { ConversationMessages } from "@/components/conversation-messages";

export function ActiveConversation({ conversationId, onBack }: ActiveConversationProps) {
  const {
    currentUserId,
    activeConversation,
    activeMessages,
    otherParticipantId,
    otherUser,
    showConversation,
  } = useActiveConversationController(conversationId);

  return (
    <div className={`flex min-h-0 flex-col ${showConversation ? "flex" : "hidden md:flex"}`}>
      {!showConversation || !activeConversation ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">{texts.messages.selectConversation}</p>
        </div>
      ) : (
        <>
          <ConversationHeader conversation={activeConversation} onBack={onBack} />
          <ConversationMessages
            messages={activeMessages}
            currentUserId={currentUserId}
            otherParticipantId={otherParticipantId}
            otherUser={otherUser}
          />
          <ConversationComposer conversationId={activeConversation.id} />
        </>
      )}
    </div>
  );
}
