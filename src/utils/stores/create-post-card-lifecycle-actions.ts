import type { PostCardStore } from "@/types/stores/post-card-store";
import { createPostCardDisposalScheduler } from "@/utils/stores/create-post-card-disposal-scheduler";
import type { StoreApi } from "zustand";

const disposalScheduler = createPostCardDisposalScheduler();

export function createPostCardLifecycleActions(
  set: StoreApi<PostCardStore>["setState"],
): Pick<PostCardStore, "initializePostCard" | "disposePostCard"> {
  return {
    initializePostCard: (post) => {
      disposalScheduler.cancel(post.id);

      set((state) => {
        if (state.cards[post.id]) return state;

        return {
          cards: {
            ...state.cards,
            [post.id]: {
              draft: "",
              commentMentions: [],
              replyToId: null,
              localComments: [],
              postCounters: post.counters,
              reactionStatus: post.currentUserReaction ?? null,
              showReactions: false,
              showReport: false,
            },
          },
        };
      });
    },
    disposePostCard: (postId) => {
      disposalScheduler.schedule(postId, () => {
        set((state) => {
          const cards = { ...state.cards };
          delete cards[postId];
          return { cards };
        });
      });
    },
  };
}
