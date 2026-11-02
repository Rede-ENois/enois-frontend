import { MutationCache, QueryClient } from "@tanstack/react-query";

import { SESSION_FLAG_KEY, isSessionKeyEvent } from "./session-key";

let browserQueryClient: QueryClient | null = null;

/** Chave da sequência diária (`GET /me/streak`). */
export const STREAK_QUERY_KEY = ["me", "streak"] as const;

/** O QueryClient do app, com os padrões de cache e a regra global de mutações abaixo. */
export function createAppQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    // ponytail: toda mutação bem-sucedida marca a sequência como velha, em vez de cada ação que
    // conta (post, comentário, reação, jogo do dia, mensagem, entrar em comunidade) lembrar disso.
    // Só refaz a busca se a sequência estiver na tela; senão é só um marcador.
    mutationCache: new MutationCache({
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: STREAK_QUERY_KEY }),
    }),
    defaultOptions: {
      queries: {
        // Voltando a aba, o TanStack so refaz a busca se os dados estiverem "velhos". Com staleTime 0
        // (o default) ele considerava tudo velho e recarregava o feed a cada troca de aba — o
        // incomodo relatado. Uma janela curta mantem o frescor sem recarregar sem motivo.
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
  return queryClient;
}

export function registerBrowserQueryClient(queryClient: QueryClient) {
  if (typeof window === "undefined") return;
  browserQueryClient = queryClient;

  // Entrar, sair ou trocar de conta em outra aba muda quem é o leitor desta. Renovar o token não
  // muda a chave da sessão; o indicador de sessão que aparece ou some cobre sessões sem chave.
  window.addEventListener("storage", (event) => {
    if (event.storageArea !== localStorage) return;
    const sessionFlipped =
      event.key === SESSION_FLAG_KEY && (event.oldValue === null) !== (event.newValue === null);
    if (event.key === null || isSessionKeyEvent(event) || sessionFlipped) {
      void queryClient.resetQueries();
    }
  });
}

export function getBrowserQueryClient() {
  return browserQueryClient;
}

/**
 * Muitas respostas dependem de quem lê (favoritado, dono, seguindo). Trocar de sessão zera a cache
 * inteira: o que é privado some e o que está na tela é buscado de novo com a sessão nova.
 */
export function resetSessionScopedData() {
  void browserQueryClient?.resetQueries();
}
