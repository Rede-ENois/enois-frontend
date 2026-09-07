import type { FormEvent } from "react";

import { getCurrentUser } from "@/lib/get-current-user";

import { createPostCommentThreads } from "@/utils/components/post/create-post-comment-threads";
import { usePostCommentSubmission } from "@/utils/components/post/use-post-comment-submission";
import { usePostCommentsLoader } from "@/utils/components/post/use-post-comments-loader";
import { usePostCommentsStore } from "@/utils/components/post/use-post-comments-store";

export function usePostCommentsController(postId: string, visible: boolean) {
  const state = usePostCommentsStore(postId);
  const loaded = usePostCommentsLoader(postId, visible, state.replaceComments);
  const submitComment = usePostCommentSubmission(
    postId,
    state.draft,
    state.replyToId,
    state.commentMentions,
    state.completeSubmission,
  );
  const { roots, threads } = createPostCommentThreads(state.comments);

  return {
    currentUser: getCurrentUser(),
    draft: state.draft,
    updateDraft: state.updateDraft,
    submit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submitComment();
    },
    submitDisabled: !state.draft.trim(),
    showComments: visible && loaded,
    showEmptyState: roots.length === 0,
    threads,
  };
}
