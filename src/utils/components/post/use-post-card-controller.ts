import { useEffect } from "react";

import { typeMeta } from "@/constants/post-type-meta";
import { usePostCardStore } from "@/stores/post-card.store";
import type { PostCardProps } from "@/types/components/post/post-card-props";

export function usePostCardController({ post }: PostCardProps) {
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

  return {
    meta: typeMeta[post.type] ?? typeMeta.INSIGHT,
    showMedia: post.mediaIds.length > 0,
    showTags: post.tags.length > 0,
  };
}
