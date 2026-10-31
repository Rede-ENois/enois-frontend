import type { PostCommunity } from "@/types/application/community/post-community";
import type { MyPostNote } from "@/types/application/feed/my-post-note";
import type { PollView } from "@/types/application/feed/poll-view";
import type { PostNote } from "@/types/application/feed/post-note";
import type { AuthorContributorTag } from "@/types/application/profile/author-contributor-tag";
import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";
import type { ReactionSummary } from "@/types/application/reaction/reaction-summary";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

export type PostView = {
  id: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  authorBadge?: string | null;
  /** Personalização do nome do autor (tema/fonte/cor); ausente = padrão. */
  authorStyle?: AuthorNameStyle | null;
  /** Tag "Contribuinte" quando o autor tem selo ativo; ausente = não é contribuinte. */
  authorContributor?: AuthorContributorTag | null;
  /** Notas de rodapé aprovadas (verificação da comunidade); vazio = nenhuma. */
  communityNotes?: PostNote[] | null;
  /** Nota do próprio leitor neste post (em análise/negada/aprovada). */
  myNote?: MyPostNote | null;
  /** Todos os emblemas (até 5), na ordem escolhida: acompanham o nome em todo lugar. */
  authorBadges?: string[] | null;
  authorAvatar: string | null;
  authorAvatarFrame?: string | null;
  /**
   * Identidade que assinou: a apresentação (nome/@/avatar) vem dela. Post CORPORATE leva ao
   * perfil profissional; SOCIAL leva ao perfil social.
   */
  authorIdentity?: "SOCIAL" | "CORPORATE";
  type:
    | "INSIGHT"
    | "ARTICLE"
    | "QUESTION"
    | "PROJECT"
    | "OPPORTUNITY"
    | "PAGE"
    | "NEWS"
    | "TUTORIAL"
    | "REVIEW"
    | "BUSINESS"
    | "DIVERTIDO"
    | "MOMENT"
    /** Ponteiro de um post de blog: o conteúdo mora em /blog/{username}. */
    | "BLOG"
    /** Enquete: o content é o título e o `poll` traz as alternativas e o voto. */
    | "POLL";
  content: string;
  /** Assunto do post (taxonomia da plataforma); nulo quando não classificado. */
  topic?: string | null;
  /** Post original de uma republicação (null = post original). */
  repostOf?: string | null;
  /** @ do autor original, exibido no crédito "Republicado de @fulano". */
  repostOfAuthor?: string | null;
  /** Repost COM opinião: o content é o comentário e o original aparece citado. */
  repostWithOpinion?: boolean;
  /** Conteúdo do original citado (preenchido na leitura de reposts com opinião). */
  repostOfContent?: string | null;
  /** Mídias do original citado. */
  repostOfMediaIds?: string[] | null;
  /** Enquete (só em posts do tipo POLL): alternativas, contagem e o voto de quem lê. */
  poll?: PollView | null;
  /** HTML já sanitizado da mini página (só em posts do tipo PAGE; nulo nos demais). */
  pageHtml?: string | null;
  /**
   * Texto do artigo (só em posts do tipo ARTICLE, e só na leitura do post único — a listagem traz
   * o resumo em `content`). Fica em tabela própria no backend.
   */
  articleBody?: string | null;
  tags: string[];
  mediaIds: string[];
  mediaSpoiler?: boolean;
  createdAt: string;
  visibility: "PUBLIC" | "CONNECTIONS" | "MENTORS";
  counters: {
    reactions: number;
    comments: number;
    saves: number;
    shares: number;
  };
  status: "ACTIVE" | "DELETED";
  currentUserReaction?: ReactionType | null;
  /**
   * Contagem por tipo de reação, calculada pelo backend em lote para a página inteira. Ausente
   * nas respostas que não calculam (publicar/editar, versões antigas): aí o card busca sozinho.
   */
  reactionSummary?: ReactionSummary | null;
  /** Comunidade do post, quando publicado numa comunidade. */
  communityId?: string | null;
  community?: PostCommunity | null;
  /** Quando o autor editou o post (nulo se nunca editado). */
  editedAt?: string | null;
  /** Prazo do Momento (some sozinho em 24h); null nos demais tipos. */
  expiresAt?: string | null;
  /** QUESTION only: the answer the asker accepted; null while the question is open. */
  acceptedCommentId?: string | null;
  /** QUESTION only: true once an answer is accepted. */
  resolved?: boolean;
};
