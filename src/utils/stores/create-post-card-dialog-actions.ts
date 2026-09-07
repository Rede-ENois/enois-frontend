import type { PostCardStore } from "@/types/stores/post-card-store";
import { updatePostCard } from "@/utils/stores/update-post-card";
import type { StoreApi } from "zustand";

export function createPostCardDialogActions(
  set: StoreApi<PostCardStore>["setState"],
): Pick<PostCardStore, "setShowReactions" | "setShowReport"> {
  return {
    setShowReactions: (postId, showReactions) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({ ...card, showReactions })),
      })),
    setShowReport: (postId, showReport) =>
      set((state) => ({
        cards: updatePostCard(state.cards, postId, (card) => ({ ...card, showReport })),
      })),
  };
}
