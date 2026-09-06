import type { Conversation } from "@/types/application/message/conversation";

export type ActiveConversationProps = {
  conversationId: Conversation["id"] | null;
  onBack: () => void;
};
