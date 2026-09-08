import { texts } from "@/texts";
import { useProfileRecentPostsController } from "@/utils/components/profile/use-profile-recent-posts-controller";

import { PostCardProvider } from "@/components/post-card-provider";
import { ProfileSection } from "@/components/profile-section";

export function ProfileRecentPostsSection() {
  const { posts, showEmptyState } = useProfileRecentPostsController();

  return (
    <ProfileSection title={texts.profile.sections.recentPosts}>
      {showEmptyState ? (
        <p className="text-[13px] font-light text-text-subtle">{texts.profile.noPosts}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCardProvider key={post.id} post={post} />
          ))}
        </div>
      )}
    </ProfileSection>
  );
}
