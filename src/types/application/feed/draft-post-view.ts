/** O rascunho do compositor como o backend o devolve (GET/PUT /feed/draft). */
export type DraftPostView = {
  id: string;
  type: string;
  content: string | null;
  pageHtml: string | null;
  articleBody: string | null;
  topic: string | null;
  pollOptions: string[];
  pollMultipleChoice: boolean;
  /** ISO 8601, ou nulo quando a enquete não tem prazo. */
  pollEndsAt: string | null;
  mentionedUserIds: string[];
  createdAt: string;
  updatedAt: string;
};
