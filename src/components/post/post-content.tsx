import type { ReactNode } from "react";

import type { PostView } from "@/lib/api";

import { MediaGrid } from "@/components/media-grid";
import { PostLinkPreviews } from "@/components/post-link-previews";
import { RichText } from "@/components/rich-text";
import { Badge } from "@/components/ui/badge";

export function PostContent({ post, reactionSummary }: { post: PostView; reactionSummary: ReactNode }) {
  return (
    <>
      <p className="mt-4 whitespace-pre-line break-words text-[15px] font-light leading-relaxed text-text-strong">
        <RichText text={post.content} />
      </p>
      {post.mediaIds.length > 0 && (
        <div className="mt-4">
          <MediaGrid mediaIds={post.mediaIds} />
        </div>
      )}
      {reactionSummary}
      <PostLinkPreviews content={post.content} />
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="rounded-full border border-border-soft bg-transparent font-light text-text-subtle"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
