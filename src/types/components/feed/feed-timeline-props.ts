import type { PostView } from "@/types/application/feed/post-view";

export type FeedTimelineProps = {
  posts: PostView[];
  isLoading: boolean;
};
