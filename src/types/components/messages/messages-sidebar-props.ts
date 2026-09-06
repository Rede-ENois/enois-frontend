import type { Conversation } from "@/types/application/message/conversation";

export type MessagesSidebarProps = {
  activeId: Conversation["id"] | null;
  onSelect: (conversationId: Conversation["id"]) => void;
};
