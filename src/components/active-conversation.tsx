import { useActiveConversationController } from "@/utils/components/messages/use-active-conversation-controller";

import { ActiveConversationContent } from "@/components/active-conversation-content";
import { ActiveConversationEmptyState } from "@/components/active-conversation-empty-state";

export function ActiveConversation() {
  const controller = useActiveConversationController();

  return (
    <div
      className={`flex min-h-0 flex-col ${controller.showConversation ? "flex" : "hidden md:flex"}`}
    >
      {!controller.showConversation || !controller.activeConversation ? (
        <ActiveConversationEmptyState />
      ) : (
        <ActiveConversationContent
          conversation={controller.activeConversation}
          messages={controller.activeMessages}
          currentUserId={controller.currentUserId}
          otherParticipantId={controller.otherParticipantId}
          otherUser={controller.otherUser}
        />
      )}
    </div>
  );
}
