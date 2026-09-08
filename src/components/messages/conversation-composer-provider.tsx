import { ConversationComposerContext } from "@/utils/components/messages/conversation-composer-context";
import { useConversationComposerController } from "@/utils/components/messages/use-conversation-composer-controller";

import { ConversationComposer } from "@/components/messages/conversation-composer";

export function ConversationComposerProvider() {
  const controller = useConversationComposerController();

  return (
    <ConversationComposerContext.Provider value={controller}>
      <ConversationComposer />
    </ConversationComposerContext.Provider>
  );
}
