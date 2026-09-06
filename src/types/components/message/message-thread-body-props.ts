import type { Message, Profile } from "@/lib/api";

export type MessageThreadBodyProps = {
  messages: Message[];
  currentUserId: string;
  otherUser?: Profile;
  otherUserId: string;
};
