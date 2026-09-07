import { useEffect } from "react";

import { usePostCardStore } from "@/stores/post-card.store";
import type { PostView } from "@/types/application/feed/post-view";

export function usePostCardLifecycle(post: PostView) {
  const initializePostCard = usePostCardStore((state) => state.initializePostCard);
  const disposePostCard = usePostCardStore((state) => state.disposePostCard);
  const setReactionStatus = usePostCardStore((state) => state.setReactionStatus);

  useEffect(() => {
    initializePostCard(post);
    return () => disposePostCard(post.id);
  }, [disposePostCard, initializePostCard, post]);

  useEffect(() => {
    setReactionStatus(post.id, post.currentUserReaction ?? null);
  }, [post.currentUserReaction, post.id, setReactionStatus]);
}
