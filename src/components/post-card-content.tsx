import { usePostCardContext } from "@/utils/components/post/use-post-card-context";

import { LinkPreviews } from "@/components/post-link-previews";
import { PostContentMedia } from "@/components/post-content-media";
import { PostContentTags } from "@/components/post-content-tags";
import { PostContentText } from "@/components/post-content-text";
import { ReactionsSummary } from "@/components/reactions-summary";

export function PostCardContent() {
  const { post, showMedia, showTags } = usePostCardContext();

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
