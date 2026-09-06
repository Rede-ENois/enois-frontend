import type { PostView } from "@/lib/api";

import { PostAuthorInfo } from "./post-author-info";
import { postTypeMeta } from "./post-type-meta";

export function PostHeader({ post }: { post: PostView }) {
  const meta = postTypeMeta[post.type] ?? postTypeMeta.INSIGHT;

  return (
    <header className="flex items-start justify-between gap-3">
      <PostAuthorInfo
        authorUsername={post.authorUsername}
        authorName={post.authorName}
        authorAvatar={post.authorAvatar}
        createdAt={post.createdAt}
        fallbackClassName={meta.classAvatar}
      />
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
        {meta.label}
      </span>
    </header>
  );
}
