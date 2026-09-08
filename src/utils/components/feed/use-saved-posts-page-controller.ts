import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";

import { listSavedPosts } from "@/lib/api/feed/list-saved-posts";

export function useSavedPostsPageController() {
  const { data } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => listSavedPosts(),
  });
  const savedPosts = data?.items ?? [];

  return {
    savedPosts,
    countLabel: texts.saved.count(savedPosts.length),
    showEmptyState: savedPosts.length === 0,
  };
}
