import { useCallback } from "react";

import type { CommentView } from "@/types/application/comment/comment-view";

import { usePostCardStore } from "@/stores/post-card.store";

export function usePostCommentsStore(postId: string) {
  const card = usePostCardStore((state) => state.cards[postId]);
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);
  const setComments = usePostCardStore((state) => state.setComments);
  const addComment = usePostCardStore((state) => state.addComment);
  const updateCommentCount = usePostCardStore((state) => state.updateCommentCount);

  const updateDraft = useCallback(
    (value: string, mentionedUserIds: string[]) => {
      setDraft(postId, value);
      setCommentMentions(postId, mentionedUserIds);
    },
    [postId, setCommentMentions, setDraft],
  );
  const replaceComments = useCallback(
    (comments: CommentView[]) => setComments(postId, comments),
    [postId, setComments],
  );
  const completeSubmission = useCallback(
    (comment: CommentView) => {
      addComment(postId, comment);
      updateCommentCount(postId, 1);
      setDraft(postId, "");
      setCommentMentions(postId, []);
      setReplyToId(postId, null);
    },
    [addComment, postId, setCommentMentions, setDraft, setReplyToId, updateCommentCount],
  );

  return {
    draft: card?.draft ?? "",
    commentMentions: card?.commentMentions ?? [],
    replyToId: card?.replyToId ?? null,
    comments: card?.localComments ?? [],
    updateDraft,
    replaceComments,
    completeSubmission,
  };
}
