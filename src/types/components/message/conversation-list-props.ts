import type { Conversation } from "@/lib/api";
import type { ConversationViewModel } from "./conversation-view-model";

export type ConversationListProps = {
  conversations: ConversationViewModel[];
  activeConversationId: string | null;
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
};
