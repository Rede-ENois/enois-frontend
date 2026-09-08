import type { Conversation } from "@/types/messages/conversation";

export type ConversationItemProps = {
  conversation: Pick<
    Conversation,
    "id" | "participantIds" | "title" | "time" | "lastMessage" | "unread"
  >;
};
