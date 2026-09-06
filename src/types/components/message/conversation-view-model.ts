import type { Conversation, Profile } from "@/lib/api";

export type ConversationViewModel = {
  conversation: Conversation;
  otherUser?: Profile;
};
