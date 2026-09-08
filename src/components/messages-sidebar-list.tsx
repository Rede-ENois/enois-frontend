import { texts } from "@/texts";
import { useMessagesSidebarListController } from "@/utils/components/messages/use-messages-sidebar-list-controller";

import { ConversationItem } from "@/components/conversation-item";

export function MessagesSidebarList() {
  const { conversations, showEmptyState } = useMessagesSidebarListController();

  return (
    <ul className="flex-1 overflow-y-auto">
      {showEmptyState ? (
        <li className="p-4 text-center text-sm text-muted-foreground">
          {texts.messages.noConversations}
        </li>
      ) : (
        conversations.map((conversation) => (
          <ConversationItem key={conversation.id} conversation={conversation} />
        ))
      )}
    </ul>
  );
}
