import type { QueryClient } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { FeedPages } from "@/types/lib/feed/feed-pages";

/**
 * Aba "Ainda não vi": o servidor deixa de mandar o post assim que ele tem reação ou comentário
 * meus, então qualquer revalidação o tira da tela na hora. Nesta aba a pessoa está lendo — a saída
 * vale para a próxima visita, não para o instante em que ela reagiu (issue #559).
 *
 * O que muda numa reação é contador e resumo, e isso o cache já recebeu na hora
 * (`updatePostInQueryCache`), então pular a revalidação não deixa nada desatualizado na tela.
 */
export function isUnseenFeedQuery(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "feed" && queryKey[1] === "UNSEEN";
}

export function updatePostInQueryCache(
  queryClient: QueryClient,
  postId: string,
  update: (post: PostView) => PostView,
) {
  // O prefixo `["feed"]` alcança também as consultas vizinhas que não são páginas de feed
  // (`["feed","scheduled"]` guarda uma lista simples). Sem esta checagem, `pages` vinha
  // indefinido e o `.map` estourava DENTRO da atualização otimista — o efeito era a ação
  // morrer antes de falar com o servidor. Só mexe em quem realmente tem páginas.
  queryClient.setQueriesData<FeedPages>({ queryKey: ["feed"] }, (current) => {
    if (!current || !Array.isArray(current.pages)) return current;
    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        items: page.items.map((post) => (post.id === postId ? update(post) : post)),
      })),
    };
  });

  queryClient.setQueryData<PostView>(["post", postId], (post) =>
    post && post.id === postId ? update(post) : post,
  );
}
