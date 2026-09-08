import type { PostReactionOption } from "@/types/components/post/post-reaction-option";

export type ReactionOptionListProps = {
  options: PostReactionOption[];
  variant: "post" | "comment";
};
