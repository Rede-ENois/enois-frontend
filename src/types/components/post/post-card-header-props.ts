import type { PostView } from "@/types/application/feed/post-view";
import type { PostTypeMeta } from "@/types/components/post/post-type-meta";

export type PostCardHeaderProps = {
  post: PostView;
  meta: PostTypeMeta;
};
