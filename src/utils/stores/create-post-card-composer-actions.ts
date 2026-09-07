import type { PostCardStore } from "@/types/stores/post-card-store";
import { updatePostCard } from "@/utils/stores/update-post-card";
import type { StoreApi } from "zustand";

export function createPostCardComposerActions(
  set: StoreApi<PostCardStore>["setState"],
): Pick<PostCardStore, "setDraft" | "setCommentMentions" | "setReplyToId"> {
  return {
    setDraft: (postId, draft) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({ ...card, draft })),
      })),
    setCommentMentions: (postId, commentMentions) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({ ...card, commentMentions })),
      })),
    setReplyToId: (postId, replyToId) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({ ...card, replyToId })),
      })),
  };
}
