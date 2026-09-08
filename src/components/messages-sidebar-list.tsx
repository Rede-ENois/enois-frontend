import { texts } from "@/texts";
import type { MessagesSidebarListProps } from "@/types/components/messages/messages-sidebar-list-props";

import { ConversationItem } from "@/components/conversation-item";

export function MessagesSidebarList({ items, showEmptyState }: MessagesSidebarListProps) {
  return (
    <ul className="flex-1 overflow-y-auto">
      {showEmptyState ? (
        <li className="p-4 text-center text-sm text-muted-foreground">
          {texts.messages.noConversations}
        </li>
      ) : (
        items.map((item) => <ConversationItem key={item.conversation.id} {...item} />)
      )}
    </ul>
  );
}
