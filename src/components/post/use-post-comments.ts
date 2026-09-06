import { type FormEvent, useState } from "react";

import { commentApi } from "@/lib/api";
import type { CommentView } from "@/lib/api";
import { createReplyTarget, getRootComments } from "@/utils/comments";

export function usePostComments(postId: string, onCountChange: (delta: number) => void) {
  const [areCommentsVisible, setAreCommentsVisible] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = commentContent.trim();
    if (!content) return;
    try {
      const comment = await commentApi.create(
        postId,
        content,
        replyToCommentId,
        mentionedUserIds,
      );
      setComments((currentComments) => [...currentComments, comment]);
      setCommentContent("");
      setMentionedUserIds([]);
      setReplyToCommentId(null);
      onCountChange(1);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentApi.remove(postId, commentId);
      setComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== commentId),
      );
      onCountChange(-1);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const handleToggleComments = async () => {
    if (!areCommentsVisible) {
      try {
        const commentsData = await commentApi.list(postId);
        setComments(commentsData.items);
      } catch {
        // Keep the existing silent-failure behavior.
      }
    }
    setAreCommentsVisible((isVisible) => !isVisible);
  };

  const handleReply = async (comment: CommentView) => {
    const replyTarget = await createReplyTarget(comment);
    setCommentContent(replyTarget.draft);
    setMentionedUserIds(replyTarget.mentionedUserIds);
    setReplyToCommentId(replyTarget.replyToId);
  };

  return {
    areCommentsVisible,
    comments,
    rootComments: getRootComments(comments),
    commentContent,
    setCommentContent: (value: string, userIds: string[]) => {
      setCommentContent(value);
      setMentionedUserIds(userIds);
    },
    handleSubmitComment,
    handleDeleteComment,
    handleToggleComments,
    handleReply,
  };
}
