import type { Conversation } from "@/types/application/message/conversation";

export type ConversationHeaderProps = {
  conversation: Pick<Conversation, "title" | "participantIds">;
  onBack?: () => void;
};
