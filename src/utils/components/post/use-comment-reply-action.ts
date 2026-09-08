import { usePostCardStore } from "@/stores/post-card.store";
import type { CommentView } from "@/types/application/comment/comment-view";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";

export function useCommentReplyAction(comment: CommentView) {
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);

  return async () => {
    try {
      const profile = await getProfileById(comment.authorId);
      if (profile?.username) {
        setDraft(comment.postId, `@${profile.username} `);
        setCommentMentions(comment.postId, [comment.authorId]);
      }
    } catch {
      setDraft(comment.postId, `${comment.authorName} `);
    }
    setReplyToId(comment.postId, comment.id);
  };
}
