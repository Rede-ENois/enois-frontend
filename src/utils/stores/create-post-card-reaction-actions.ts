import type { PostCardStore } from "@/types/stores/post-card-store";
import { updatePostCard } from "@/utils/stores/update-post-card";
import type { StoreApi } from "zustand";

export function createPostCardReactionActions(
  set: StoreApi<PostCardStore>["setState"],
): Pick<PostCardStore, "setReactionStatus"> {
  return {
    setReactionStatus: (postId, reactionStatus) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({ ...card, reactionStatus })),
      })),
  };
}
