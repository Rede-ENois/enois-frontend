import type { PostCardProps } from "@/types/components/post/post-card-props";
import { usePostCardController } from "@/utils/components/post/use-post-card-controller";

import { PostActions } from "@/components/post-actions";
import { PostCardContent } from "@/components/post-card-content";
import { PostCardHeader } from "@/components/post-card-header";

export function PostCard(props: PostCardProps) {
  const { post } = props;
  const { meta, showMedia, showTags } = usePostCardController(props);

  return (
    <article className="min-w-0 rounded-2xl border border-border-soft bg-surface-card p-4 transition sm:p-5">
      <PostCardHeader post={post} meta={meta} />
      <PostCardContent post={post} showMedia={showMedia} showTags={showTags} />
      <PostActions post={post} />
    </article>
  );
}
