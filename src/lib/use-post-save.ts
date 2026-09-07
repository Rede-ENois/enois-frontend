import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { listSavedPosts } from "@/lib/api/feed/list-saved-posts";
import { removeSave } from "@/lib/api/reactions/remove-save";
import { save } from "@/lib/api/reactions/save";
import { usePostCardStore } from "@/stores/post-card.store";

export function usePostSave(postId: string) {
  const [saved, setSaved] = useState(false);
  const setPostCounters = usePostCardStore((state) => state.setPostCounters);
  const { data } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => listSavedPosts(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) setSaved(data.items.some((post) => post.id === postId));
  }, [data, postId]);

  const toggleSave = async () => {
    try {
      const result = saved ? await removeSave(postId) : await save(postId);
      setSaved(!saved);
      setPostCounters(postId, result.counters);
    } catch {
      // silently fail
    }
  };

  return { saved, toggleSave };
}
