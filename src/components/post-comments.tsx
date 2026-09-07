import type { PostCommentsProps } from "@/types/components/post/post-comments-props";

import { usePostCommentsController } from "@/utils/components/post/use-post-comments-controller";

import { PostCommentComposer } from "@/components/post-comment-composer";
import { PostCommentThreads } from "@/components/post-comment-threads";

export function PostComments({ postId, visible }: PostCommentsProps) {
  const controller = usePostCommentsController(postId, visible);

  if (!controller.showComments) return null;

  return (
    <section className="mt-4 border-t border-border-soft pt-4">
      <PostCommentThreads threads={controller.threads} showEmptyState={controller.showEmptyState} />
      <PostCommentComposer
        currentUser={controller.currentUser}
        draft={controller.draft}
        onDraftChange={controller.updateDraft}
        onSubmit={controller.submit}
        submitDisabled={controller.submitDisabled}
      />
    </section>
  );
}
