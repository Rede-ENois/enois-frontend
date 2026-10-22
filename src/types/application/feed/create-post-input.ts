import type { PostView } from "./post-view";

export type CreatePostInput = Pick<PostView, "type" | "content"> &
  Partial<Pick<PostView, "tags" | "mediaIds" | "pageHtml" | "articleBody" | "mediaSpoiler">> & {
    mentionedUserIds?: string[];
    communityId?: string;
    /** Assunto do post AVULSO (um da taxonomia). Em comunidade o post herda o dela — não mande. */
    topic?: string;
    /** Canal privado da comunidade (o tema vem do canal; o post não entra em feed). */
    channelId?: string;
    /** Honeypot — humano nunca vê nem preenche; bot que preenche é banido no backend. */
    website?: string;
  };
