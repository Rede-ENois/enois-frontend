// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIsPlatformAdmin } from "./use-is-platform-admin";

/** Um componente mínimo: mostra "admin" ou "pessoa" conforme o hook. */
function Probe() {
  return <>{useIsPlatformAdmin() ? "admin" : "pessoa"}</>;
}

describe("useIsPlatformAdmin", () => {
  const fetchMock = vi.fn();
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
    vi.unstubAllGlobals();
  });

  const respond = (status: number, body: unknown) =>
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

  /**
   * Monta e só retorna quando a consulta de `/moderation/me` terminou: não interessa no meio do
   * caminho, e sim o que a tela mostra depois que o backend respondeu.
   */
  const mount = async () => {
    const finished = new Promise<void>((resolve) => {
      const stop = client.getQueryCache().subscribe((event) => {
        if (event.type !== "updated") return;
        if (event.action.type !== "success" && event.action.type !== "error") return;
        if (event.query.queryKey[0] !== "moderator") return;
        stop();
        resolve();
      });
    });
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      );
    });
    await act(async () => {
      await finished;
    });
    act(() => {
      // Re-renderiza com o dado já no cache, como o app faz na troca de estado da consulta.
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      );
    });
  };

  it("não mostra o controle administrativo para quem não é admin", async () => {
    respond(200, { admin: false, moderator: true });
    await mount();
    expect(host.textContent).toBe("pessoa");
  });

  it("mostra o controle só quando o backend confirma admin", async () => {
    respond(200, { admin: true });
    await mount();
    expect(host.textContent).toBe("admin");
  });

  it('trata falha de leitura como "não é admin"', async () => {
    respond(401, { code: "UNAUTHORIZED" });
    await mount();
    expect(host.textContent).toBe("pessoa");
  });
});
