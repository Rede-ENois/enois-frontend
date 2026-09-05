import { Loader2 } from "lucide-react";

import type { PostView } from "@/lib/api";

import { PostCard } from "@/components/post/post-card";

export function FeedTimeline({ posts, loading }: { posts: PostView[]; loading: boolean }) {
  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-8 text-text-subtle">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {!loading && posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
