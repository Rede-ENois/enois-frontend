import type { PostReactionControlsProps } from "@/types/components/post/post-reaction-controls-props";

export type PostReactionPickerProps = Pick<
  PostReactionControlsProps,
  "active" | "emoji" | "title" | "options"
>;
