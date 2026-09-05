import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { feedApi, reactionsApi } from "@/lib/api";
import type { PostView, ReactionType } from "@/lib/api";

export function usePostInteractions(post: PostView) {
  const [counters, setCounters] = useState(post.counters);
  const [reactionStatus, setReactionStatus] = useState<string | null>(post.currentUserReaction ?? null);
  const [saved, setSaved] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => setReactionStatus(post.currentUserReaction ?? null), [post.currentUserReaction]);

  const { data: savedData } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => feedApi.listSaved(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (savedData) setSaved(savedData.items.some((savedPost) => savedPost.id === post.id));
  }, [savedData, post.id]);

  const react = async (type: ReactionType) => {
    try {
      const removing = reactionStatus === type;
      const result = removing
        ? await reactionsApi.removeReaction(post.id)
        : await reactionsApi.react(post.id, type);
      setReactionStatus(removing ? null : type);
      if ("counters" in result && result.counters) setCounters(result.counters);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const save = async () => {
    try {
      const result = saved ? await reactionsApi.removeSave(post.id) : await reactionsApi.save(post.id);
      setSaved((value) => !value);
      setCounters(result.counters);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const share = async () => {
    try {
      const result = await reactionsApi.share(post.id);
      setCounters(result.counters);
      const url = `${window.location.origin}/feed/${post.id}`;
      await (navigator.share ? navigator.share({ url }) : navigator.clipboard.writeText(url));
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const changeCommentCount = (delta: number) => {
    setCounters((current) => ({ ...current, comments: current.comments + delta }));
  };

  return {
    counters,
    reactionStatus,
    saved,
    showReactions,
    showReport,
    setShowReactions,
    setShowReport,
    react,
    save,
    share,
    changeCommentCount,
  };
}
