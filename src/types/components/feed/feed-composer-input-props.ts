import type { Profile } from "@/types/application/profile/profile";

export type FeedComposerInputProps = {
  currentUser: Profile | null | undefined;
  content: string;
  onContentChange: (value: string, mentionedUserIds: string[]) => void;
};
