import type { PostReactionControlsProps } from "@/types/components/post/post-reaction-controls-props";

import { PostReactionCountButton } from "@/components/post-reaction-count-button";
import { PostReactionPicker } from "@/components/post-reaction-picker";

export function PostReactionControls(props: PostReactionControlsProps) {
  return (
    <div className="flex">
      <PostReactionPicker
        active={props.active}
        emoji={props.emoji}
        title={props.title}
        options={props.options}
      />
      <PostReactionCountButton count={props.count} onOpen={props.onOpen} />
    </div>
  );
}
