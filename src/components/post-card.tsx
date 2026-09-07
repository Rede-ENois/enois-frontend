import { typeMeta } from "@/constants/post-type-meta";
import { texts } from "@/texts";
import type { PostCardProps } from "@/types/components/post/post-card-props";
import { linkifyText } from "@/utils/linkify-text";

import { usePostCardLifecycle } from "@/lib/use-post-card-lifecycle";

import { Badge } from "@/components/ui/badge";

import { PostActions } from "@/components/post-actions";
import { AuthorInfo } from "@/components/post-author-info";
import { LinkPreviews } from "@/components/post-link-previews";
import { MediaGrid } from "@/components/post-media-grid";
import { ReactionsSummary } from "@/components/reactions-summary";

export function PostCard({ post }: PostCardProps) {
  const meta = typeMeta[post.type] ?? typeMeta.INSIGHT;
  usePostCardLifecycle(post);

  return (
    <article className="min-w-0 rounded-2xl border border-border-soft bg-surface-card p-4 transition sm:p-5">
      <header className="flex justify-between items-start gap-3">
        <AuthorInfo
          authorUsername={post.authorUsername}
          authorName={post.authorName}
          authorAvatar={post.authorAvatar}
          createdAt={post.createdAt}
          fallbackClassName={meta.classAvatar}
        />

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
        >
          {meta.label}
        </span>
      </header>

      <p className="mt-4 whitespace-pre-line break-words text-[15px] font-light leading-relaxed text-text-strong">
        {linkifyText(post.content)}
      </p>

      {post.mediaIds.length > 0 && (
        <div className="mt-4">
          <MediaGrid mediaIds={post.mediaIds} />
        </div>
      )}

      <ReactionsSummary postId={post.id} />
      <LinkPreviews content={post.content} />

      {post.tags.length > 0 && (
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

      <PostActions post={post} />
    </article>
  );
}
