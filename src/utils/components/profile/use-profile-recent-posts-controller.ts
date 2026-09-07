import { useQuery } from "@tanstack/react-query";

import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

import { listPostsByUserId } from "@/lib/api/feed/list-posts-by-user-id";

export function useProfileRecentPostsController({ user }: ProfileHeaderProps) {
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
