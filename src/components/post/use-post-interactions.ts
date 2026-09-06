import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { feedApi, reactionApi } from "@/lib/api";
import type { PostView, ReactionType } from "@/lib/api";

export function usePostInteractions(post: PostView) {
  const [counters, setCounters] = useState(post.counters);
  const [currentReaction, setCurrentReaction] = useState<string | null>(
    post.currentUserReaction ?? null,
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isReactionsDialogOpen, setIsReactionsDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  useEffect(
    () => setCurrentReaction(post.currentUserReaction ?? null),
    [post.currentUserReaction],
  );

  const { data: savedPostsData } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => feedApi.listSaved(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (savedPostsData) {
      setIsSaved(savedPostsData.items.some((savedPost) => savedPost.id === post.id));
    }
  }, [savedPostsData, post.id]);

  const handleReaction = async (type: ReactionType) => {
    try {
      const isRemovingReaction = currentReaction === type;
      const result = isRemovingReaction
        ? await reactionApi.removePostReaction(post.id)
        : await reactionApi.reactToPost(post.id, type);
      setCurrentReaction(isRemovingReaction ? null : type);
      if ("counters" in result && result.counters) setCounters(result.counters);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const handleSave = async () => {
    try {
      const result = isSaved
        ? await reactionApi.unsavePost(post.id)
        : await reactionApi.savePost(post.id);
      setIsSaved((wasSaved) => !wasSaved);
      setCounters(result.counters);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const handleShare = async () => {
    try {
      const result = await reactionApi.sharePost(post.id);
      setCounters(result.counters);
      const url = `${window.location.origin}/feed/${post.id}`;
      await (navigator.share
        ? navigator.share({ url })
        : navigator.clipboard.writeText(url));
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const handleCommentCountChange = (delta: number) => {
    setCounters((currentCounters) => ({
      ...currentCounters,
      comments: currentCounters.comments + delta,
    }));
  };

  return {
    counters,
    currentReaction,
    isSaved,
    isReactionsDialogOpen,
    isReportDialogOpen,
    setIsReactionsDialogOpen,
    setIsReportDialogOpen,
    handleReaction,
    handleSave,
    handleShare,
    handleCommentCountChange,
  };
}
