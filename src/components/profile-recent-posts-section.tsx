import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

import { listPostsByUserId } from "@/lib/api/feed/list-posts-by-user-id";

import { PostCard } from "@/components/post-card";
import { ProfileSection } from "@/components/profile-section";

export function ProfileRecentPostsSection({ user }: ProfileHeaderProps) {
  const { data } = useQuery({
    queryKey: ["feed", "user", user.id],
    queryFn: () => listPostsByUserId(user.id),
  });
  const posts = data?.items ?? [];

  return (
    <ProfileSection title={texts.profile.sections.recentPosts}>
      {posts.length === 0 ? (
        <p className="text-[13px] font-light text-text-subtle">{texts.profile.noPosts}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </ProfileSection>
  );
}
