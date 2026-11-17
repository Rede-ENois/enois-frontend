/** Corpo do PUT /feed/draft: o estado do compositor que viaja para o servidor. */
export type DraftPostInput = {
  type: string;
  content?: string;
  pageHtml?: string;
  articleBody?: string;
  topic?: string;
  pollOptions?: string[];
  pollMultipleChoice?: boolean;
  pollEndsAt?: string;
  mentionedUserIds?: string[];
};
