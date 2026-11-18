import type { ConfissaoPostView } from "@/types/application/confessionario/confissao-post-view";

/** Página do feed do Confessionário: do mais recente ao mais antigo, cursor para a próxima. */
export type ConfessionarioPage = {
  items: ConfissaoPostView[];
  nextCursor: string | null;
};
