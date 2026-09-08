import type { PostCardContentProps } from "@/types/components/post/post-card-content-props";

import { PostContentMedia } from "@/components/post-content-media";
import { PostContentTags } from "@/components/post-content-tags";
import { PostContentText } from "@/components/post-content-text";
import { LinkPreviews } from "@/components/post-link-previews";
import { ReactionsSummary } from "@/components/reactions-summary";

export function PostCardContent({ post, showMedia, showTags }: PostCardContentProps) {
  return (
    <>
      <PostContentText content={post.content} />
      {showMedia && <PostContentMedia mediaIds={post.mediaIds} />}
      <ReactionsSummary postId={post.id} />
      <LinkPreviews content={post.content} />
      {showTags && <PostContentTags tags={post.tags} />}
    </>
  );
}
