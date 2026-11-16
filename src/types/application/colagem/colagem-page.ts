import type { ColagemPostView } from "@/types/application/colagem/colagem-post-view";

/** Página do mural da Colagem: fotos em ordem do mais recente, cursor para a página seguinte. */
export type ColagemPage = {
  items: ColagemPostView[];
  nextCursor: string | null;
};
