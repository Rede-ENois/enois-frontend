import { useCommunityDetailContext } from "@/utils/components/communities/use-community-detail-context";

import { PostCardProvider } from "@/components/post-card-provider";

export function CommunityFeed() {
  const { posts, showEmptyState, emptyMessage } = useCommunityDetailContext();

  return (
    <div className="flex-1 space-y-6 overflow-visible px-0 pb-3 pt-0">
      {posts.map((post) => (
        <PostCardProvider key={post.id} post={post} />
      ))}

      {showEmptyState ? (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground shadow-sm">
          {emptyMessage}
        </div>
      ) : null}
    </div>
  );
}
