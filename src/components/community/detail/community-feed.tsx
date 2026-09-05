import type { PostView } from "@/lib/api";
import { texts } from "@/texts";

import { PostCard } from "@/components/post/post-card";

export function CommunityFeed({ posts, emptyText }: { posts: PostView[]; emptyText: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{texts.communities.detail.feed}</h2>
      {posts.length === 0 ? (
        <p className="surface-card p-8 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
