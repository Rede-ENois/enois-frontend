import { type FormEvent, useState } from "react";

import { commentsApi } from "@/lib/api";
import type { CommentView } from "@/lib/api";
import { createReplyTarget, getRootComments } from "@/utils/comments";

export function usePostComments(postId: string, onCountChange: (delta: number) => void) {
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [commentMentions, setCommentMentions] = useState<string[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    try {
      const comment = await commentsApi.create(postId, content, replyToId, commentMentions);
      setComments((current) => [...current, comment]);
      setDraft("");
      setCommentMentions([]);
      setReplyToId(null);
      onCountChange(1);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await commentsApi.remove(postId, commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      onCountChange(-1);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const toggleComments = async () => {
    if (!showComments) {
      try {
        const data = await commentsApi.list(postId);
        setComments(data.items);
      } catch {
        // Keep the existing silent-failure behavior.
      }
    }
    setShowComments((value) => !value);
  };

  const startReply = async (comment: CommentView) => {
    const target = await createReplyTarget(comment);
    setDraft(target.draft);
    setCommentMentions(target.mentionedUserIds);
    setReplyToId(target.replyToId);
  };

  return {
    showComments,
    comments,
    rootComments: getRootComments(comments),
    draft,
    setDraft: (value: string, ids: string[]) => { setDraft(value); setCommentMentions(ids); },
    submitComment,
    deleteComment,
    toggleComments,
    startReply,
  };
}
