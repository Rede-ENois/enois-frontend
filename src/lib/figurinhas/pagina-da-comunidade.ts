import type { PaginaParaOGrade } from "@/types/components/emotes/pagina-para-o-grade";

import { figurinhasApi } from "./api";

/**
 * Uma página do catálogo da comunidade (`GET /figurinhas`) para a aba "Da comunidade" do seletor.
 *
 * O `code` vai sem os dois-pontos: o clique no seletor devolve o código cru, que é o que o campo de
 * escrita transforma em `:codigo:` ao inserir. A miniatura é a imagem que a figurinha já guarda no
 * CDN do site — nada de pedir ao provedor de terceiros.
 */
export async function paginaDaComunidade(
  page: number,
  termo: string,
  limit: number,
): Promise<PaginaParaOGrade> {
  const resposta = await figurinhasApi.pagina(page, limit, termo || undefined);
  return {
    items: resposta.items.map((figurinha) => ({
      code: figurinha.codigo.replace(/^:|:$/g, ""),
      thumb: figurinha.imagem,
    })),
    page: resposta.page,
    total: resposta.total,
    totalPages: resposta.totalPages,
  };
}
