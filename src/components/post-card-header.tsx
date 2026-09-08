import { usePostCardContext } from "@/utils/components/post/use-post-card-context";

import { AuthorInfo } from "@/components/post-author-info";
import { PostTypeBadge } from "@/components/post-type-badge";

export function PostCardHeader() {
  const { post, meta } = usePostCardContext();

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
