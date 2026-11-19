import type { ColagemAuthorView } from "@/types/application/colagem/colagem-author-view";

/** Uma contribuição na foto aberta: texto e/ou UMA foto. */
export type ColagemCommentView = {
  id: string;
  author: ColagemAuthorView;
  content: string | null;
  mediaId: string | null;
  mediaUrl: string | null;
  mediaSpoiler: boolean;
  parentCommentId: string | null;
  createdAt: string;
};
