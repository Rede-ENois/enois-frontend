/**
 * Estado UI efêmero do card de post - APENAS o que não vive no TanStack Query cache.
 *
 * Estado que NÃO está aqui (já vive no cache via feed query / comments query):
 * - postCounters → post.counters (feed query)
 * - reactionStatus → post.currentUserReaction (feed query)
 * - reactionSummary → post.reactionSummary (feed query)
 * - localComments → commentsApi.list (comments query)
 */
export type PostCardState = {
  draft: string;
  commentMentions: string[];
  replyToId: string | null;
  showReactions: boolean;
  showSeals: boolean;
  showReport: boolean;
  /** Reação em andamento: enquanto true, a prop do feed não pode sobrescrever o estado otimista. */
  reactionPending: boolean;
};
