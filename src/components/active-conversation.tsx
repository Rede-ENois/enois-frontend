import { useActiveConversationController } from "@/utils/components/messages/use-active-conversation-controller";

import { ActiveConversationEmptyState } from "@/components/active-conversation-empty-state";
import { ConversationComposerProvider } from "@/components/conversation-composer-provider";
import { ConversationHeaderProvider } from "@/components/conversation-header-provider";
import { ConversationMessagesProvider } from "@/components/conversation-messages-provider";

export function ActiveConversation() {
  const controller = useActiveConversationController();

  return (
    <div
      className={`flex min-h-0 flex-col ${controller.showConversation ? "flex" : "hidden md:flex"}`}
    >
      {controller.showConversation ? (
        <>
          <ConversationHeaderProvider />
          <ConversationMessagesProvider />
          <ConversationComposerProvider />
        </>
      ) : (
        <ActiveConversationEmptyState />
      )}
    </div>
  );
}
