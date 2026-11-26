import type { WrappedResposta } from "@/types/application/wrapped/wrapped-resposta";

import { api } from "../api-client";

/**
 * O Énóis Wrapped: a retrospectiva anual da PRÓPRIA conta. O backend lê da sessão, então o módulo
 * não manda id de conta nenhum — não há como pedir a de outra pessoa.
 */
export const wrappedApi = {
  retrospectiva: (ano: number) => api.get<WrappedResposta>(`/wrapped/${ano}`),
};
