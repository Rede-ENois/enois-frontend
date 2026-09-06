import type { Message, Profile } from "@/lib/api";

export type MessageListProps = {
  messages: Message[];
  currentUserId: string;
  otherUser?: Profile;
  otherUserId: string;
};
