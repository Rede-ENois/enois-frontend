import type { PostView } from "@/types/application/feed/post-view";

export type CommunityFeedProps = {
  posts: PostView[];
  emptyText: string;
};
