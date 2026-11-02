export type UseAcceptedAnswerResult = {
  /** Accepted answer as the viewer sees it right now (optimistic). */
  acceptedId: string | null;
  /** True while an accept/unaccept request is in flight. */
  pending: boolean;
  accept: (commentId: string) => void;
  unaccept: () => void;
  /** Mirrors the backend: deleting the accepted comment reopens the question. */
  commentDeleted: (commentId: string) => void;
};
