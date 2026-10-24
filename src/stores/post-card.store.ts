import type { PostCardState } from "@/types/stores/post-card-state";
import type { PostCardStore } from "@/types/stores/post-card-store";
import { create } from "zustand";

const pendingDisposals = new Map<string, ReturnType<typeof setTimeout>>();

function updateCard(
  cards: Record<string, PostCardState>,
  postId: string,
  update: (card: PostCardState) => PostCardState,
) {
  const card = cards[postId];
  if (!card) return cards;

  const next = update(card);
  // Valor igual ao que já está lá: devolve o mesmo objeto, para o card não renderizar de novo.
  // O card do feed grava a reação do servidor ao montar, quase sempre a mesma do estado inicial.
  const changed = (Object.keys(next) as (keyof PostCardState)[]).some(
    (key) => !Object.is(next[key], card[key]),
  );
  if (!changed) return cards;

  return {
    ...cards,
    [postId]: next,
  };
}

/**
 * Store APENAS para estado UI efêmero do card de post.
 *
 * Estado que NÃO deve estar aqui (já vive no TanStack Query cache via feed/comments queries):
 * - postCounters (vem de post.counters)
 * - reactionStatus (vem de post.currentUserReaction)
 * - reactionSummary (vem de post.reactionSummary)
 * - localComments (carregados por PostComments via commentsApi.list)
 *
 * Estado que FICA aqui (ephemeral UI state):
 * - draft (rascunho de comentário)
 * - commentMentions (menções no rascunho)
 * - replyToId (resposta a comentário)
 * - showReactions (diálogo de reações aberto)
 * - showSeals (diálogo de selos aberto)
 * - showReport (diálogo de denúncia aberto)
 * - reactionPending (otimismo: evita sobrescrever durante mutation)
 */
export const usePostCardStore = create<PostCardStore>()((set) => ({
  cards: {} as Record<string, PostCardState>,

  initializePostCard: (postId: string) => {
    const pendingDisposal = pendingDisposals.get(postId);
    if (pendingDisposal) {
      clearTimeout(pendingDisposal);
      pendingDisposals.delete(postId);
    }

    set((state) => {
      if (state.cards[postId]) return state;

      return {
        cards: {
          ...state.cards,
          [postId]: {
            draft: "",
            commentMentions: [],
            replyToId: null,
            showReactions: false,
            showSeals: false,
            showReport: false,
            reactionPending: false,
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
    set((state) => ({
      cards: updateCard(state.cards, postId, (card) => ({ ...card, replyToId })),
    })),
  setShowReactions: (postId: string, showReactions: boolean) =>
    set((state) => ({
      cards: updateCard(state.cards, postId, (card) => ({ ...card, showReactions })),
    })),
  setShowSeals: (postId: string, showSeals: boolean) =>
    set((state) => ({
      cards: updateCard(state.cards, postId, (card) => ({ ...card, showSeals })),
    })),
  setShowReport: (postId: string, showReport: boolean) =>
    set((state) => ({
      cards: updateCard(state.cards, postId, (card) => ({ ...card, showReport })),
    })),
  setReactionPending: (postId: string, reactionPending: boolean) =>
    set((state) => ({
      cards: updateCard(state.cards, postId, (card) => ({ ...card, reactionPending })),
    })),
}));
