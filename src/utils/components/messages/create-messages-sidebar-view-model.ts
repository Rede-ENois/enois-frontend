import { texts } from "@/texts";
import type { Conversation } from "@/types/application/message/conversation";

export function createMessagesSidebarViewModel(
  activeId: string | null,
  conversations: Conversation[],
  showSearch: boolean,
) {
  return {
    sidebarClassName: activeId ? "hidden md:flex" : "flex",
    showEmptyState: conversations.length === 0,
    searchToggleLabel: showSearch ? texts.messages.back : texts.messages.new,
    conversations: conversations.map((conversation) => ({
      conversation,
      isActive: conversation.id === (activeId ?? ""),
    })),
  };
}
