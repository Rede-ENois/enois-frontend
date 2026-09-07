import { create } from "zustand";

import type { PostCardState } from "@/types/stores/post-card-state";
import type { PostCardStore } from "@/types/stores/post-card-store";

const pendingDisposals = new Map<string, ReturnType<typeof setTimeout>>();

export const usePostCardStore = create<PostCardStore>()((set) => {
  const updateCard = (
    cards: Record<string, PostCardState>,
    postId: string,
    update: (card: PostCardState) => PostCardState,
  ) => {
    const card = cards[postId];
    if (!card) return cards;

    return {
      ...cards,
      [postId]: update(card),
    };
  };

  return {
    cards: {},

    initializePostCard: (post) => {
      const pendingDisposal = pendingDisposals.get(post.id);
      if (pendingDisposal) {
        clearTimeout(pendingDisposal);
        pendingDisposals.delete(post.id);
      }

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
      const pendingDisposal = pendingDisposals.get(postId);
      if (pendingDisposal) clearTimeout(pendingDisposal);

      pendingDisposals.set(
        postId,
        setTimeout(() => {
          set((state) => {
            const cards = { ...state.cards };
            delete cards[postId];
            return { cards };
          });
          pendingDisposals.delete(postId);
        }, 0),
      );
    },
    setDraft: (postId, draft) =>
      set((state) => ({ cards: updateCard(state.cards, postId, (card) => ({ ...card, draft })) })),
    setCommentMentions: (postId, commentMentions) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, commentMentions })),
      })),
    setReplyToId: (postId, replyToId) =>
      set((state) => ({ cards: updateCard(state.cards, postId, (card) => ({ ...card, replyToId })) })),
    setComments: (postId, localComments) =>
      set((state) => ({ cards: updateCard(state.cards, postId, (card) => ({ ...card, localComments })) })),
    addComment: (postId, comment) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({
          ...card,
          localComments: [...card.localComments, comment],
        })),
      })),
    removeComment: (postId, commentId) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({
          ...card,
          localComments: card.localComments.filter((comment) => comment.id !== commentId),
        })),
      })),
    updateCommentCount: (postId, delta) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({
          ...card,
          postCounters: {
            ...card.postCounters,
            comments: card.postCounters.comments + delta,
          },
        })),
      })),
    setPostCounters: (postId, postCounters) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, postCounters })),
      })),
    setReactionStatus: (postId, reactionStatus) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, reactionStatus })),
      })),
    setShowReactions: (postId, showReactions) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, showReactions })),
      })),
    setShowReport: (postId, showReport) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, showReport })),
      })),
  };
});
