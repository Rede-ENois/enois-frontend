import type { Conversation, Profile } from "@/lib/api";

export type ConversationWithUser = {
  conversation: Conversation;
  otherUser?: Profile;
};
