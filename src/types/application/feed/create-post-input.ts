import type { PostView } from "./post-view";

export type CreatePostInput = Pick<PostView, "type" | "content"> &
  Partial<Pick<PostView, "tags" | "mediaIds" | "pageHtml" | "articleBody" | "mediaSpoiler">> & {
    mentionedUserIds?: string[];
    communityId?: string;
    /** Assunto do post AVULSO (um da taxonomia). Em comunidade o post herda o dela — não mande. */
    topic?: string;
    /** Canal privado da comunidade (o tema vem do canal; o post não entra em feed). */
    channelId?: string;
    /** Alternativas da enquete (2 a 6), só quando `type` é `POLL`; nos outros tipos é ignorado. */
    pollOptions?: string[];
    /** Enquete de múltipla escolha (só `POLL`): cada pessoa pode marcar mais de uma alternativa. */
    pollMultipleChoice?: boolean;
    /** Prazo de encerramento da enquete (só `POLL`), ISO-8601; ausente = sem prazo. */
    pollEndsAt?: string;
    /** Honeypot — humano nunca vê nem preenche; bot que preenche é banido no backend. */
    website?: string;
  };
