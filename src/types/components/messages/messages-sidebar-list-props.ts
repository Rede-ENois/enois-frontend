import type { MessagesSidebarConversation } from "@/types/components/messages/messages-sidebar-conversation";

export type MessagesSidebarListProps = {
  items: MessagesSidebarConversation[];
  showEmptyState: boolean;
};
