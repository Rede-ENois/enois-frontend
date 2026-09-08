import type { PostReactionOption } from "@/types/components/post/post-reaction-option";

export type ReactionOptionButtonProps = {
  option: PostReactionOption;
  variant: "post" | "comment";
};
