import type { PostReactionOption } from "@/types/components/post/post-reaction-option";

export type PostReactionControlsProps = {
  active: boolean;
  emoji: string | null;
  title: string;
  options: PostReactionOption[];
  count: number;
  onOpen: () => void;
};
