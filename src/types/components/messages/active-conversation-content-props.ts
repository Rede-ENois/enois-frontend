import type { Conversation } from "@/types/application/message/conversation";
import type { Message } from "@/types/application/message/message";
import type { Profile } from "@/types/application/profile/profile";

export type ActiveConversationContentProps = {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string | null;
  otherParticipantId?: string;
  otherUser?: Profile;
  onBack: () => void;
};
