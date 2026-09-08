import type { FormEvent } from "react";

import { usePostCommentSubmission } from "@/utils/components/post/use-post-comment-submission";
import { usePostCommentsStore } from "@/utils/components/post/use-post-comments-store";

import { getCurrentUser } from "@/lib/get-current-user";

export function usePostCommentComposerController(postId: string) {
  const state = usePostCommentsStore(postId);
  const submitComment = usePostCommentSubmission(
    postId,
    state.draft,
    state.replyToId,
    state.commentMentions,
    state.completeSubmission,
  );

  return {
    currentUser: getCurrentUser(),
    draft: state.draft,
    updateDraft: state.updateDraft,
    submit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submitComment();
    },
    submitDisabled: !state.draft.trim(),
  };
}
