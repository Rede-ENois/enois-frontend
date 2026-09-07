import { texts } from "@/texts";
import type { Conversation } from "@/types/application/message/conversation";
import type { MessagesSidebarProps } from "@/types/components/messages/messages-sidebar-props";

export function createMessagesSidebarViewModel(
  activeId: MessagesSidebarProps["activeId"],
  conversations: Conversation[],
  showSearch: boolean,
  onSelect: MessagesSidebarProps["onSelect"],
  markAsRead: (conversationId: string) => void,
) {
  return {
    sidebarClassName: activeId ? "hidden md:flex" : "flex",
    showEmptyState: conversations.length === 0,
    searchToggleLabel: showSearch ? texts.messages.back : texts.messages.new,
    conversations: conversations.map((conversation) => ({
      conversation,
      isActive: conversation.id === (activeId ?? ""),
      select: () => {
        onSelect(conversation.id);
        if (conversation.unread > 0) markAsRead(conversation.id);
      },
    })),
  };
}
