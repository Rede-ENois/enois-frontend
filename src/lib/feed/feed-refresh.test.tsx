// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider, focusManager, useQuery } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { feedRefreshOptions } from "./post-query-cache";

/**
 * A regressão da issue #559: voltar o foco na janela não pode refazer NENHUMA aba do feed — a
 * revalidação de foco refazia a consulta inteira (todas as páginas carregadas) e, na aba "Ainda
 * não vi", tirava da tela o post que a pessoa acabou de ver. Quem mantém o feed em dia hoje é a
 * varredura de `feed-live.ts`, uma página por vez. Aqui a consulta é montada com as opções reais
 * de `useFeed` e o foco é disparado de verdade.
 */
function Probe({ tab, queryFn }: { tab: string; queryFn: () => Promise<unknown> }) {
  useQuery({
    queryKey: ["feed", tab, "", ""],
    queryFn,
    staleTime: 0,
    ...feedRefreshOptions(tab),
  });
  return null;
}

describe("renovação automática do feed", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    host.remove();
    focusManager.setFocused(undefined);
    vi.unstubAllGlobals();
  });

  it("voltar o foco na janela não refaz nenhuma aba do feed", async () => {
    const unseen = vi.fn().mockResolvedValue({ pages: [], pageParams: [] });
    const all = vi.fn().mockResolvedValue({ pages: [], pageParams: [] });

    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Probe tab="UNSEEN" queryFn={unseen} />
          <Probe tab="ALL" queryFn={all} />
        </QueryClientProvider>,
      ),
    );
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(unseen).toHaveBeenCalledTimes(1);
    expect(all).toHaveBeenCalledTimes(1);

    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));

    // Nem a "Tudo" refaz: cada volta de foco eram todas as páginas carregadas de novo.
    expect(all).toHaveBeenCalledTimes(1);
    expect(unseen).toHaveBeenCalledTimes(1);
  });
});
