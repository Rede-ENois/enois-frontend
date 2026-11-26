import type { PaginaDeVagas } from "@/types/application/job/pagina-de-vagas";
import type { Paginacao } from "@/types/application/job/paginacao";

// Soma a página que acabou de chegar na lista: a primeira (de uma busca nova) começa a lista e as
// de "carregar mais" entram no fim. Devolve a mesma referência quando nada muda.
export function converterPaginacao(
  anterior: Paginacao,
  chave: string,
  cursor: string | null,
  resposta: PaginaDeVagas,
): Paginacao {
  const itens = resposta.items ?? [];
  if (anterior.chave !== chave) {
    return cursor === null ? { chave, jobs: itens, cursor: null } : anterior;
  }
  // A mesma página com o mesmo cursor (cache, refetch): a lista não muda. O estado guarda o
  // cursor de onde a resposta veio, então é ele que a busca do render atual vai usar.
  if (anterior.cursor === cursor) return anterior;
  return {
    chave,
    jobs:
      cursor === null
        ? itens
        : [...anterior.jobs, ...itens.filter((job) => !anterior.jobs.some((j) => j.id === job.id))],
    cursor,
  };
}
