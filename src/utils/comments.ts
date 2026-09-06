import type { CommentView } from "@/lib/api";
import { profileApi } from "@/lib/api";
import type { ReplyTarget } from "@/types/application/comment/reply-target";

export async function createReplyTarget(comment: CommentView): Promise<ReplyTarget> {
  try {
    const profile = await profileApi.getById(comment.authorId);
    if (profile?.username) {
      return {
        draft: `@${profile.username} `,
        mentionedUserIds: [comment.authorId],
        replyToId: comment.id,
      };
    }
  } catch {
    // Fall through to the author-name fallback.
  }

  return {
    draft: `${comment.authorName} `,
    mentionedUserIds: [],
    replyToId: comment.id,
  };
}

export function getRootComments(comments: CommentView[]): CommentView[] {
  return comments.filter((comment) => !comment.parentCommentId);
}

export function getReplies(comments: CommentView[], parentId: string): CommentView[] {
  return comments.filter((comment) => comment.parentCommentId === parentId);
}

export function getParentAuthorName(
  comments: CommentView[],
  parentCommentId: string | null,
): string | undefined {
  if (!parentCommentId) return undefined;
  return comments.find((comment) => comment.id === parentCommentId)?.authorName;
}
