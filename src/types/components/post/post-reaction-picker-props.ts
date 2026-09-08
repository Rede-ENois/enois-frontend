import type { PostReactionOption } from "@/types/components/post/post-reaction-option";

export type PostReactionPickerProps = {
  active: boolean;
  emoji: string | null;
  title: string;
  options: PostReactionOption[];
};
