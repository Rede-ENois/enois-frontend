import type { Query, QueryClient } from "@tanstack/react-query";

import type { Paged } from "@/types/lib/inbox-sync";

import { fetchFirstPage, mergeRows } from "./query-first-page";

/**
 * Sincronia da caixa de entrada: o stream avisa que UMA conversa ou que UM aviso mudou, e o cache
 * continua sendo a verdade para o resto.
 *
 * Antes, cada aviso invalidava o prefixo inteiro (`["conversations"]`, `["notifications"]`). Numa
 * consulta infinita isso refaz TODAS as páginas carregadas: uma mensagem nova recarregava a lista
 * de conversas, as arquivadas, o contador do dock, o resumo do menu e o histórico inteiro da thread
 * aberta. As respostas chegavam fora de ordem, a lista piscava e reordenava, e o servidor recebia
 * uma rajada de requisições por mensagem.
 *
 * Aqui a revalidação vai só onde o aviso aponta, e só a primeira página: mudar a conversa X não
 * muda o histórico antigo de X nem as conversas que ninguém tocou. Consulta sem observador (tela
 * que não está aberta) não é buscada — ela será carregada do zero quando a tela abrir. A única
 * exceção é a lista paginada por posição (ver `needsFullRefresh`).
 */

const MESSAGES_KEY = "messages";
const CONVERSATIONS_KEY = "conversations";
const NOTIFICATIONS_KEY = "notifications";

/** Consultas de página, na tela, sob o prefixo dado. */
function pagedQueries(queryClient: QueryClient, queryKey: readonly unknown[]): Query[] {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey })
    .filter((query) => query.getObserversCount() > 0)
    .filter((query) => Array.isArray((query.state.data as { pages?: unknown } | undefined)?.pages));
}

/**
 * Busca a primeira página da consulta e põe as linhas novas na frente das que já estavam, por id.
 * As páginas seguintes ficam como estão: quem rolou até o fim não perde o lugar porque chegou uma
 * mensagem, e o cursor da cauda continua sendo o que a tela carregou.
 */
async function refreshFirstPage(queryClient: QueryClient, query: Query): Promise<void> {
  const fresh = await fetchFirstPage<{ id: string }>(queryClient, query);
  if (!fresh) return;

  queryClient.setQueryData<Paged<{ id: string }>>(query.queryKey, (current) => {
    if (!current || !Array.isArray(current.pages) || current.pages.length === 0) return current;
    const [first, ...older] = current.pages;
    // Campos mudados com os mesmos ids (prévia editada, leitura acesa) PRECISAM chegar:
    // comparar quantidades deixava a resposta fresca de fora justamente nesse caso.
    const items = mergeRows(fresh.items, first.items);
    return { ...current, pages: [{ ...first, items }, ...older] };
  });
}

/**
 * Consulta cujo cursor é uma POSIÇÃO na ordem (`meta.positionCursor`, a lista de avisos não lidos
 * primeiro) e que já tem mais de uma página carregada. Ali a exceção à regra "só a primeira página"
 * é obrigatória: quando um aviso carregado muda de grupo (é lido) ou chega um novo, as linhas
 * seguintes andam uma posição e o cursor da cauda passa a apontar para a linha errada — renovando
 * só o topo, "Carregar mais" pulava um aviso não lido. Refazer as páginas em sequência recalcula
 * os cursores a partir das respostas novas.
 */
function needsFullRefresh(query: Query): boolean {
  const pages = (query.state.data as { pages: unknown[] }).pages;
  return query.options.meta?.positionCursor === true && pages.length > 1;
}

function refreshPaged(queryClient: QueryClient, queryKey: readonly unknown[]): Promise<unknown>[] {
  return pagedQueries(queryClient, queryKey).map((query) =>
    // Falha de rede aqui é igual à de `refreshFirstPage`: o cache fica como estava, sem rejeitar.
    needsFullRefresh(query)
      ? query.fetch().catch(() => undefined)
      : refreshFirstPage(queryClient, query),
  );
}

/**
 * "A conversa X mudou": a thread aberta recarrega a primeira página, e as listas de conversas da
 * tela saem adiantadas (a mensagem nova muda o horário da linha e a ordem de quem falou por último).
 *
 * A thread só é buscada se estiver aberta — conversa fechada carrega do zero quando a pessoa abrir.
 */
export function refreshConversation(
  queryClient: QueryClient,
  conversationId: string,
): Promise<unknown> {
  return Promise.all([
    ...refreshPaged(queryClient, [CONVERSATIONS_KEY]),
    // Contador do dock e resumo do menu são consultas pequenas: recarregam por inteiro.
    queryClient.refetchQueries({ queryKey: [CONVERSATIONS_KEY, "unread-count"], type: "active" }),
    ...refreshPaged(queryClient, [MESSAGES_KEY, conversationId]),
  ]);
}

/**
 * "Chegou aviso": as listas de avisos na tela (sino e página) recarregam a primeira página e o
 * resumo do menu é buscado de novo. O resumo é uma consulta agregada, sem página para preservar.
 */
export function refreshNotifications(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    ...refreshPaged(queryClient, [NOTIFICATIONS_KEY]),
    queryClient.refetchQueries({ queryKey: [NOTIFICATIONS_KEY, "summary"], type: "active" }),
  ]);
}

/**
 * O stream caiu e voltou: o que mudou enquanto ele estava fora só se descobre consultando. Aqui,
 * ao contrário do aviso pontual, toda consulta na tela é conferida — uma vez, só a primeira página.
 * `invalidateQueries` refaria todas as páginas carregadas de cada consulta infinita, que é
 * justamente a rajada que este módulo evita.
 */
export function resyncInbox(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    ...refreshPaged(queryClient, [MESSAGES_KEY]),
    ...refreshPaged(queryClient, [CONVERSATIONS_KEY]),
    ...refreshPaged(queryClient, [NOTIFICATIONS_KEY]),
    queryClient.refetchQueries({ queryKey: [CONVERSATIONS_KEY, "unread-count"], type: "active" }),
    queryClient.refetchQueries({ queryKey: [NOTIFICATIONS_KEY, "summary"], type: "active" }),
  ]);
}
