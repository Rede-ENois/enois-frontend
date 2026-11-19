import type { PageResponse } from "@/types/application/api/page-response";

/**
 * As paginas de uma lista de posts com cada post uma unica vez, onde apareceu primeiro.
 *
 * Listas sao chaveadas por post id, e um id repetido seria medido como o mesmo card duas vezes. Ids
 * repetem porque um repost puro e so um ponteiro: a lista devolve o post ORIGINAL (com `repostedBy`)
 * na data do repost, e o original aparece de novo mais abaixo na data dele. Com dois cards na mesma
 * key, qualquer mudanca acima do fim da lista (refresh colocando posts no topo, exclusao) fazia o
 * React mover o card errado e deixar o outro na pagina sem desmontar: botoes morriam ou controlavam
 * a copia, e um dialog aberto nele travava a pagina inteira com pointer-events: none.
 *
 * Manter o primeiro significa que uma pagina carregada depois so perde seus proprios repetidos: os
 * cards ja na tela nunca se movem por causa disso. Uma pagina intocada mantem sua identidade.
 */
export function withoutRepeatedPosts<T extends { id: string }>(
  pages: readonly PageResponse<T>[],
): PageResponse<T>[] {
  const seen = new Set<string>();
  return pages.map((page) => {
    const items = page.items.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
    return items.length === page.items.length ? page : { ...page, items };
  });
}
