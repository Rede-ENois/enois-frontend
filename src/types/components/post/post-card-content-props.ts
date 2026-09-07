import type { PostView } from "@/types/application/feed/post-view";

export type PostCardContentProps = {
  post: PostView;
  showMedia: boolean;
  showTags: boolean;
};
