import type { DesabafoPostView } from "@/types/application/desabafos/desabafo-post-view";

/** Página do feed dos Desabafos: do mais recente ao mais antigo, cursor para a página seguinte. */
export type DesabafosPage = {
  items: DesabafoPostView[];
  nextCursor: string | null;
};
