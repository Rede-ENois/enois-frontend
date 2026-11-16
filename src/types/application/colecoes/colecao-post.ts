import type { PostView } from "@/types/application/feed/post-view";

/** A publicação guardada na coleção: o post inteiro do feed (comentários e reações seguem lá). */
export type ColecaoPost = {
  postId: string;
  post: PostView;
  adicionadoAt: string;
};
