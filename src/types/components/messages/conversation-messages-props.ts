import type { Message } from "@/types/application/message/message";
import type { Profile } from "@/types/application/profile/profile";

export type ConversationMessagesProps = {
  messages: Message[];
  currentUserId: string | null;
  otherParticipantId?: string;
  otherUser?: Profile;
};
