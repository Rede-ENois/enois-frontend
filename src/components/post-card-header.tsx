import type { PostCardHeaderProps } from "@/types/components/post/post-card-header-props";

import { AuthorInfo } from "@/components/post-author-info";

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

      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
      >
        {meta.label}
      </span>
    </header>
  );
}
