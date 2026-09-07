import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { listSavedPosts } from "@/lib/api/feed/list-saved-posts";
import { react } from "@/lib/api/reactions";
import { removeReaction } from "@/lib/api/reactions/remove-reaction";
import { removeSave } from "@/lib/api/reactions/remove-save";
import { save } from "@/lib/api/reactions/save";
import { share } from "@/lib/api/reactions/share";
import { usePostCardStore } from "@/stores/post-card.store";
import type { PostView } from "@/types/application/feed/post-view";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

export function usePostCardActions(post: PostView) {
  const [saved, setSaved] = useState(false);
  const initializePostCard = usePostCardStore((state) => state.initializePostCard);
  const disposePostCard = usePostCardStore((state) => state.disposePostCard);
  const card = usePostCardStore((state) => state.cards[post.id]);
  const setPostCounters = usePostCardStore((state) => state.setPostCounters);
  const setReactionStatus = usePostCardStore((state) => state.setReactionStatus);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);
  const setShowReport = usePostCardStore((state) => state.setShowReport);

  const postCounters = card?.postCounters ?? post.counters;
  const reactionStatus = card?.reactionStatus ?? post.currentUserReaction ?? null;

  useEffect(() => {
    initializePostCard(post);
    return () => disposePostCard(post.id);
  }, [disposePostCard, initializePostCard, post]);

  useEffect(() => {
    setReactionStatus(post.id, post.currentUserReaction ?? null);
  }, [post.currentUserReaction, post.id, setReactionStatus]);

  const { data: savedData } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => listSavedPosts(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (savedData) {
      setSaved(savedData.items.some((savedPost) => savedPost.id === post.id));
    }
  }, [savedData, post.id]);

  const handleReaction = async (type: ReactionType) => {
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

  const handleSave = async () => {
    try {
      const result = saved ? await removeSave(post.id) : await save(post.id);
      setSaved(!saved);
      setPostCounters(post.id, result.counters);
    } catch {
      // silently fail
    }
  };

  const handleShare = async () => {
    try {
      const result = await share(post.id);
      setPostCounters(post.id, result.counters);
      const url = `${window.location.origin}/feed/${post.id}`;
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // silently fail
    }
  };

  return {
    postCounters,
    reactionStatus,
    saved,
    handleReaction,
    handleSave,
    handleShare,
    showReactions: () => setShowReactions(post.id, true),
    showReport: () => setShowReport(post.id, true),
  };
}
