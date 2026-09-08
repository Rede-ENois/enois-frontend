import type { Conversation } from "@/types/application/message/conversation";

export type MessagesSidebarConversation = {
  conversation: Conversation;
  isActive: boolean;
};
