// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider, focusManager, useQuery } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { feedRefreshOptions } from "./post-query-cache";

/**
 * A regressão da issue #559 não é só a invalidação explícita: o app tem
 * `refetchOnWindowFocus: true` e a aba UNSEEN tem `staleTime` curto, então voltar o foco na janela
 * refazia a busca e o post que a pessoa acabou de reagir saía da tela. Aqui a consulta é montada
 * com as opções reais de `useFeed` e o foco é disparado de verdade.
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

  it("voltar o foco na janela não refaz a aba 'Ainda não vi'", async () => {
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

    // A "Tudo" é o controle: ela refaz a busca no foco, então o foco chegou de fato.
    expect(all).toHaveBeenCalledTimes(2);
    expect(unseen).toHaveBeenCalledTimes(1);
  });
});
