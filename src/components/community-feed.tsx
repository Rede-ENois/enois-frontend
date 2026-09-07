import { texts } from "@/texts";
import type { CommunityFeedProps } from "@/types/components/communities/community-feed-props";

import { PostCard } from "@/components/post-card";

export function CommunityFeed({ posts, showEmptyState, emptyMessage }: CommunityFeedProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{texts.communities.detail.feed}</h2>

      {showEmptyState ? (
        <p className="surface-card p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </section>
  );
}
