import type { PostCardStore } from "@/types/stores/post-card-store";
import { updatePostCard } from "@/utils/stores/update-post-card";
import type { StoreApi } from "zustand";

export function createPostCardCommentActions(
  set: StoreApi<PostCardStore>["setState"],
): Pick<PostCardStore, "setComments" | "addComment" | "removeComment"> {
  return {
    setComments: (postId, localComments) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({ ...card, localComments })),
      })),
    addComment: (postId, comment) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({
          ...card,
          localComments: [...card.localComments, comment],
        })),
      })),
    removeComment: (postId, commentId) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({
          ...card,
          localComments: card.localComments.filter((comment) => comment.id !== commentId),
        })),
      })),
  };
}
