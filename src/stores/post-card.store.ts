import { create } from "zustand";

import type { CommentView } from "@/types/application/comment/comment-view";
import type { PostView } from "@/types/application/feed/post-view";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { PostCardState } from "@/types/stores/post-card-state";

const pendingDisposals = new Map<string, ReturnType<typeof setTimeout>>();

export const usePostCardStore = create((set) => {
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
    cards: {} as Record<string, PostCardState>,

    initializePostCard: (post: PostView) => {
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
    disposePostCard: (postId: string) => {
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
    setDraft: (postId: string, draft: string) =>
      set((state) => ({ cards: updateCard(state.cards, postId, (card) => ({ ...card, draft })) })),
    setCommentMentions: (postId: string, commentMentions: string[]) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, commentMentions })),
      })),
    setReplyToId: (postId: string, replyToId: string | null) =>
      set((state) => ({ cards: updateCard(state.cards, postId, (card) => ({ ...card, replyToId })) })),
    setComments: (postId: string, localComments: CommentView[]) =>
      set((state) => ({ cards: updateCard(state.cards, postId, (card) => ({ ...card, localComments })) })),
    addComment: (postId: string, comment: CommentView) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({
          ...card,
          localComments: [...card.localComments, comment],
        })),
      })),
    removeComment: (postId: string, commentId: string) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({
          ...card,
          localComments: card.localComments.filter((comment) => comment.id !== commentId),
        })),
      })),
    updateCommentCount: (postId: string, delta: number) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({
          ...card,
          postCounters: {
            ...card.postCounters,
            comments: card.postCounters.comments + delta,
          },
        })),
      })),
    setPostCounters: (postId: string, postCounters: PostView["counters"]) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, postCounters })),
      })),
    setReactionStatus: (postId: string, reactionStatus: ReactionType | null) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, reactionStatus })),
      })),
    setShowReactions: (postId: string, showReactions: boolean) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, showReactions })),
      })),
    setShowReport: (postId: string, showReport: boolean) =>
      set((state) => ({
        cards: updateCard(state.cards, postId, (card) => ({ ...card, showReport })),
      })),
  };
});
