import { useActiveConversationController } from "@/utils/messages/use-active-conversation-controller";

import { ActiveConversationEmptyState } from "@/components/messages/active-conversation-empty-state";
import { ConversationComposerProvider } from "@/components/messages/conversation-composer-provider";
import { ConversationHeaderProvider } from "@/components/messages/conversation-header-provider";
import { ConversationMessagesProvider } from "@/components/messages/conversation-messages-provider";

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
