import { usePostCommentsContext } from "@/utils/components/post/use-post-comments-context";

import { PostCommentComposer } from "@/components/post-comment-composer";
import { PostCommentThreads } from "@/components/post-comment-threads";

export function PostComments() {
  const { showComments } = usePostCommentsContext();

  if (!showComments) return null;

  return (
    <section className="mt-4 border-t border-border-soft pt-4">
      <PostCommentThreads />
      <PostCommentComposer />
    </section>
  );
}
