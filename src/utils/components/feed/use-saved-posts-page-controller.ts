import { useQuery } from "@tanstack/react-query";

import { listSavedPosts } from "@/lib/api/feed/list-saved-posts";

export function useSavedPostsPageController() {
  const { data } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => listSavedPosts(),
  });

  return {
    savedPosts: data?.items ?? [],
  };
}
