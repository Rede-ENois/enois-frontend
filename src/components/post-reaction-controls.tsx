import { usePostActionsContext } from "@/utils/components/post/use-post-actions-context";

import { PostReactionCountButton } from "@/components/post-reaction-count-button";
import { PostReactionPicker } from "@/components/post-reaction-picker";

export function PostReactionControls() {
  const {
    reactionActive,
    reactionEmoji,
    reactionTitle,
    reactionOptions,
    postCounters,
    openReactions,
  } = usePostActionsContext();

  return (
    <div className="flex">
      <PostReactionPicker
        active={reactionActive}
        emoji={reactionEmoji}
        title={reactionTitle}
        options={reactionOptions}
      />
      <PostReactionCountButton count={postCounters.reactions} onOpen={openReactions} />
    </div>
  );
}
