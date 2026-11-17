import type { PostView } from "@/types/application/feed/post-view";
import type { MuralAutor } from "@/types/application/murais/mural-autor";

/** A publicação colada no mural: o post inteiro do feed (comentários e reações seguem lá). */
export type MuralContribuicao = {
  postId: string;
  post: PostView;
  addedBy: MuralAutor;
  addedAt: string;
};
