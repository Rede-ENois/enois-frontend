import { ConversationHeaderContext } from "@/utils/messages/conversation-header-context";
import { useConversationHeaderController } from "@/utils/messages/use-conversation-header-controller";

import { ConversationHeader } from "@/components/messages/conversation-header";

export function ConversationHeaderProvider() {
  const view = useConversationHeaderController();

  return (
    <ConversationHeaderContext.Provider value={view}>
      <ConversationHeader />
    </ConversationHeaderContext.Provider>
  );
}
