import type { Conversation } from "@/types/application/message/conversation";

export type ConversationItemProps = {
  conversation: Pick<
    Conversation,
    "id" | "participantIds" | "title" | "time" | "lastMessage" | "unread"
  >;
};
