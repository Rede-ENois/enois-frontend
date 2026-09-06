import type { Profile } from "@/lib/api";

export type MessageThreadHeaderProps = {
  title: string;
  otherUser?: Profile;
  otherUserId: string;
  onBack: () => void;
};
