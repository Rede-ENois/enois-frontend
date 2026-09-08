import type { ActiveConversationProps } from "@/types/components/messages/active-conversation-props";

import { useActiveConversationController } from "@/utils/components/messages/use-active-conversation-controller";

import { ActiveConversationContent } from "@/components/active-conversation-content";
import { ActiveConversationEmptyState } from "@/components/active-conversation-empty-state";

export function ActiveConversation({ conversationId, onBack }: ActiveConversationProps) {
  const controller = useActiveConversationController(conversationId);

  return (
    <div className={`flex min-h-0 flex-col ${controller.showConversation ? "flex" : "hidden md:flex"}`}>
      {!controller.showConversation || !controller.activeConversation ? (
        <ActiveConversationEmptyState />
      ) : (
        <ActiveConversationContent
          conversation={controller.activeConversation}
          messages={controller.activeMessages}
          currentUserId={controller.currentUserId}
          otherParticipantId={controller.otherParticipantId}
          otherUser={controller.otherUser}
          onBack={onBack}
        />
      )}
    </div>
  );
}
