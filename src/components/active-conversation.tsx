import { useActiveConversationController } from "@/utils/components/messages/use-active-conversation-controller";

import { ActiveConversationEmptyState } from "@/components/active-conversation-empty-state";
import { ConversationComposer } from "@/components/conversation-composer";
import { ConversationHeader } from "@/components/conversation-header";
import { ConversationMessages } from "@/components/conversation-messages";

export function ActiveConversation() {
  const controller = useActiveConversationController();

  return (
    <div
      className={`flex min-h-0 flex-col ${controller.showConversation ? "flex" : "hidden md:flex"}`}
    >
      {controller.showConversation ? (
        <>
          <ConversationHeader />
          <ConversationMessages />
          <ConversationComposer />
        </>
      ) : (
        <ActiveConversationEmptyState />
      )}
    </div>
  );
}
