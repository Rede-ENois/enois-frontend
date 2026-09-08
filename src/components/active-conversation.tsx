import { useActiveConversationController } from "@/utils/components/messages/use-active-conversation-controller";

import { ActiveConversationEmptyState } from "@/components/active-conversation-empty-state";
import { ConversationComposerProvider } from "@/components/conversation-composer-provider";
import { ConversationHeader } from "@/components/conversation-header";
import { ConversationMessagesProvider } from "@/components/conversation-messages-provider";

export function ActiveConversation() {
  const controller = useActiveConversationController();

  return (
    <div
      className={`flex min-h-0 flex-col ${controller.showConversation ? "flex" : "hidden md:flex"}`}
    >
      {controller.showConversation ? (
        <>
          <ConversationHeader />
          <ConversationMessagesProvider />
          <ConversationComposerProvider />
        </>
      ) : (
        <ActiveConversationEmptyState />
      )}
    </div>
  );
}
