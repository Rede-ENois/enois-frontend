import { usePostCardStore } from "@/stores/post-card.store";
import type { PostView } from "@/types/application/feed/post-view";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

import { react } from "@/lib/api/reactions";
import { removeReaction } from "@/lib/api/reactions/remove-reaction";

export function usePostReaction(post: PostView) {
  const card = usePostCardStore((state) => state.cards[post.id]);
  const setPostCounters = usePostCardStore((state) => state.setPostCounters);
  const setReactionStatus = usePostCardStore((state) => state.setReactionStatus);
  const reactionStatus = card?.reactionStatus ?? post.currentUserReaction ?? null;

  const reactToPost = async (type: ReactionType) => {
    try {
      if (reactionStatus === type) {
        const result = await removeReaction(post.id);
        setReactionStatus(post.id, null);
        if ("counters" in result) setPostCounters(post.id, result.counters!);
      } else {
        const result = await react(post.id, type);
        setReactionStatus(post.id, type);
        if ("counters" in result) setPostCounters(post.id, result.counters!);
      }
    } catch {
      // silently fail
    }
  };

  return { reactionStatus, reactToPost };
}
