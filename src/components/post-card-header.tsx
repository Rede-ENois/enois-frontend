import type { PostCardHeaderProps } from "@/types/components/post/post-card-header-props";

import { AuthorInfo } from "@/components/post-author-info";
import { PostTypeBadge } from "@/components/post-type-badge";

export function PostCardHeader({ post, meta }: PostCardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <AuthorInfo
        authorUsername={post.authorUsername}
        authorName={post.authorName}
        authorAvatar={post.authorAvatar}
        createdAt={post.createdAt}
        fallbackClassName={meta.classAvatar}
      />
      <PostTypeBadge meta={meta} />
    </header>
  );
}
