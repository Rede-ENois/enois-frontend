import { texts } from "@/texts";
import type { PostCardContentProps } from "@/types/components/post/post-card-content-props";
import { linkifyText } from "@/utils/linkify-text";

import { Badge } from "@/components/ui/badge";

import { LinkPreviews } from "@/components/post-link-previews";
import { MediaGrid } from "@/components/post-media-grid";
import { ReactionsSummary } from "@/components/reactions-summary";

export function PostCardContent({ post, showMedia, showTags }: PostCardContentProps) {
  return (
    <>
      <p className="mt-4 whitespace-pre-line break-words text-[15px] font-light leading-relaxed text-text-strong">
        {linkifyText(post.content)}
      </p>

      {showMedia && (
        <div className="mt-4">
          <MediaGrid mediaIds={post.mediaIds} />
        </div>
      )}

      <ReactionsSummary postId={post.id} />
      <LinkPreviews content={post.content} />

      {showTags && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="rounded-full border border-border-soft bg-transparent font-light text-text-subtle"
            >
              {texts.posts.tag(tag)}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
