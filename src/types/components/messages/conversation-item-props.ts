import type { Conversation } from "@/types/application/message/conversation";

export type ConversationItemProps = {
  conversation: Pick<Conversation, "participantIds" | "title" | "time" | "lastMessage" | "unread">;
  isActive: boolean;
  onSelect: () => void;
};
