import { Loader2 } from "lucide-react";

import type { FeedTimelineProps } from "@/types/components/feed/feed-timeline-props";

import { PostCard } from "@/components/post/post-card";

export function FeedTimeline({ posts, isLoading }: FeedTimelineProps) {
  return (
    <div className="space-y-4">
      {isLoading && <div className="flex items-center justify-center py-8 text-text-subtle"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      {!isLoading && posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
