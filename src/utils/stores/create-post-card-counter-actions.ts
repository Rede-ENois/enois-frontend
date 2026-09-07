import type { PostCardStore } from "@/types/stores/post-card-store";
import { updatePostCard } from "@/utils/stores/update-post-card";
import type { StoreApi } from "zustand";

export function createPostCardCounterActions(
  set: StoreApi<PostCardStore>["setState"],
): Pick<PostCardStore, "updateCommentCount" | "setPostCounters"> {
  return {
    updateCommentCount: (postId, delta) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({
          ...card,
          postCounters: {
            ...card.postCounters,
            comments: card.postCounters.comments + delta,
          },
        })),
      })),
    setPostCounters: (postId, postCounters) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({ ...card, postCounters })),
      })),
  };
}
