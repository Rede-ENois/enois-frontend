/** Response of POST/DELETE /feed/posts/{postId}/accepted-answer. */
export type AcceptedAnswerView = {
  postId: string;
  acceptedCommentId: string | null;
  resolved: boolean;
};
