import { useQuery } from "@tanstack/react-query";

import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { listPostsByUserId } from "@/lib/api/feed/list-posts-by-user-id";

export function useProfileRecentPostsController() {
  const { user } = useProfilePageContext();
  const { data } = useQuery({
    queryKey: ["feed", "user", user.id],
    queryFn: () => listPostsByUserId(user.id),
  });
  const posts = data?.items ?? [];

  return {
    posts,
    showEmptyState: posts.length === 0,
  };
}
