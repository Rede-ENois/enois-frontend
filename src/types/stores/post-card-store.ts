import type { PostCardState } from "@/types/stores/post-card-state";

/**
 * O estado dos cards de post: um por post, pela chave do id.
 *
 * O tipo existe para o store não ser unknown - sem ele, cada seletor (state.cards[postId])
 * virava um erro de tipo em quem lesse o store, e o mesmo post aberto em duas telas (o feed e o
 * post do blog) precisa do MESMO estado: é aqui que a conversa aberta numa aparece na outra.
 */
export type PostCardStore = {
  cards: Record<string, PostCardState>;
  initializePostCard: (postId: string) => void;
  disposePostCard: (postId: string) => void;
  setDraft: (postId: string, draft: string) => void;
  setCommentMentions: (postId: string, commentMentions: string[]) => void;
  setReplyToId: (postId: string, replyToId: string | null) => void;
  setShowReactions: (postId: string, showReactions: boolean) => void;
  setShowSeals: (postId: string, showSeals: boolean) => void;
  setShowReport: (postId: string, showReport: boolean) => void;
  setReactionPending: (postId: string, reactionPending: boolean) => void;
};
