import type { PostView } from "@/types/application/feed/post-view";

export type CommunityFeedProps = {
  posts: PostView[];
  showEmptyState: boolean;
  emptyMessage: string;
};
