import { useEffect, useState } from "react";

import { usePostCardStore } from "@/stores/post-card.store";

import { listComments } from "@/lib/api/comments";
import { createComment } from "@/lib/api/comments/create-comment";
import { getCurrentUser } from "@/lib/get-current-user";

export function usePostComments(postId: string, visible: boolean) {
  const currentUser = getCurrentUser();
  const card = usePostCardStore((state) => state.cards[postId]);
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);
  const setComments = usePostCardStore((state) => state.setComments);
  const addComment = usePostCardStore((state) => state.addComment);
  const updateCommentCount = usePostCardStore((state) => state.updateCommentCount);
  const [loaded, setLoaded] = useState(false);

  const draft = card?.draft ?? "";
  const commentMentions = card?.commentMentions ?? [];
  const replyToId = card?.replyToId ?? null;
  const localComments = card?.localComments ?? [];

  useEffect(() => {
    if (!visible) {
      setLoaded(false);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    listComments(postId)
      .then((data) => {
        if (!cancelled) setComments(postId, data.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, setComments, visible]);

  const submitComment = async () => {
    const content = draft.trim();
    if (!content) return;

    try {
      const newComment = await createComment(postId, content, replyToId, commentMentions);
      addComment(postId, newComment);
      updateCommentCount(postId, 1);
      setDraft(postId, "");
      setCommentMentions(postId, []);
      setReplyToId(postId, null);
    } catch {
      // silently fail
    }
  };

  const updateDraft = (value: string, mentionedUserIds: string[]) => {
    setDraft(postId, value);
    setCommentMentions(postId, mentionedUserIds);
  };

  return {
    currentUser,
    draft,
    localComments,
    loaded,
    submitComment,
    updateDraft,
  };
}
