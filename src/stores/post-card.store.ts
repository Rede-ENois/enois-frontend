import type { PostCardStore } from "@/types/stores/post-card-store";
import { createPostCardDisposalScheduler } from "@/utils/stores/create-post-card-disposal-scheduler";
import { updatePostCard } from "@/utils/stores/update-post-card";
import { create } from "zustand";

const disposalScheduler = createPostCardDisposalScheduler();

export const usePostCardStore = create<PostCardStore>()((set) => ({
  cards: {},

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
  setDraft: (postId, draft) =>
    set((state) => ({ cards: updatePostCard(state.cards, postId, (card) => ({ ...card, draft })) })),
  setCommentMentions: (postId, commentMentions) =>
    set((state) => ({
      cards: updatePostCard(state.cards, postId, (card) => ({ ...card, commentMentions })),
    })),
  setReplyToId: (postId, replyToId) =>
    set((state) => ({
      cards: updatePostCard(state.cards, postId, (card) => ({ ...card, replyToId })),
    })),
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
  setReactionStatus: (postId, reactionStatus) =>
    set((state) => ({
      cards: updatePostCard(state.cards, postId, (card) => ({ ...card, reactionStatus })),
    })),
  setShowReactions: (postId, showReactions) =>
    set((state) => ({
      cards: updatePostCard(state.cards, postId, (card) => ({ ...card, showReactions })),
    })),
  setShowReport: (postId, showReport) =>
    set((state) => ({
      cards: updatePostCard(state.cards, postId, (card) => ({ ...card, showReport })),
    })),
}));
