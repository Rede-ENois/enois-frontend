import type { CommentView } from "@/types/application/comment/comment-view";

export function createPostCommentThreads(comments: CommentView[]) {
  const roots = comments.filter((comment) => !comment.parentCommentId);
  const threads = roots.map((comment) => ({
    comment,
    replies: comments
      .filter((reply) => reply.parentCommentId === comment.id)
      .map((reply) => ({
        reply,
        replyingTo: comments.find((candidate) => candidate.id === reply.parentCommentId)?.authorName,
      })),
  }));

  return { roots, threads };
}
