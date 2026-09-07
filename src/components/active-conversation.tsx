import { texts } from "@/texts";
import type { ActiveConversationProps } from "@/types/components/messages/active-conversation-props";

import { useActiveConversation } from "@/lib/use-active-conversation";

import { ConversationComposer } from "@/components/conversation-composer";
import { ConversationHeader } from "@/components/conversation-header";
import { ConversationMessages } from "@/components/conversation-messages";

export function ActiveConversation({ conversationId, onBack }: ActiveConversationProps) {
  const { currentUserId, activeConversation, activeMessages, otherParticipantId, otherUser } =
    useActiveConversation(conversationId);

  return (
    <div className={`flex min-h-0 flex-col ${!activeConversation ? "hidden md:flex" : "flex"}`}>
      {!activeConversation ? (
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
