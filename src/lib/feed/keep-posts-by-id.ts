import { replaceEqualDeep } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { FeedPages } from "@/types/lib/feed/feed-pages";

function isFeedPages(value: unknown): value is FeedPages {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { pages?: unknown }).pages) &&
    (value as FeedPages).pages.every((page) => Array.isArray(page?.items))
  );
}

/**
 * Compartilhamento estrutural do feed por id do post, nao por posicao.
 *
 * O padrao do React Query (`replaceEqualDeep`) compara as listas indice a indice. Um post novo no
 * topo empurra todos os outros uma posicao para baixo, entao nenhum deles casava com o objeto de
 * antes: todos viravam objetos novos, o `memo` do `PostCard` falhava e cada cartao da pagina
 * renderizava de novo — com seus hooks — so porque alguem publicou. Aqui o post que continua igual
 * volta a ser o MESMO objeto, esteja onde estiver; o que mudou ganha objeto novo (reaproveitando as
 * partes iguais, como faz o padrao). Os campos da pagina (`lastSeenAt`, `nextCursor`) vem sempre da
 * resposta nova.
 *
 * Vale para a busca da consulta e para `setQueryData` (a varredura de `feed-live`, edicao, exclusao),
 * porque o React Query aplica a mesma opcao nos dois caminhos.
 */
export function keepPostsById(oldData: unknown, newData: unknown): unknown {
  const shared = replaceEqualDeep(oldData, newData);
  if (shared === oldData || !isFeedPages(oldData) || !isFeedPages(shared)) return shared;

  const previous = new Map<string, PostView>();
  for (const page of oldData.pages) {
    for (const post of page.items) {
      if (!previous.has(post.id)) previous.set(post.id, post);
    }
  }

  let changed = false;
  const pages = shared.pages.map((page) => {
    let pageChanged = false;
    const items = page.items.map((post) => {
      const before = previous.get(post.id);
      if (!before || before === post) return post;
      const kept = replaceEqualDeep(before, post);
      if (kept !== post) pageChanged = true;
      return kept;
    });
    if (!pageChanged) return page;
    changed = true;
    return { ...page, items };
  });

  return changed ? { ...shared, pages } : shared;
}
