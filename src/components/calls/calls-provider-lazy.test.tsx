// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

import { callSessionStore, getCallSession } from "@/lib/calls/call-session";

import { CallsProvider } from "./calls-provider";

const panel = vi.hoisted(() => ({
  loaded: vi.fn(),
  rendered: vi.fn(() => null),
}));

vi.mock("@/lib/api", () => ({
  callsApi: { open: vi.fn(async () => []) },
}));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/require-auth", () => ({ hasSession: () => true }));
vi.mock("@/lib/message-stream", () => ({ subscribeToCallEvents: () => () => {} }));
vi.mock("@/lib/lite-mode", () => ({ readEconomicMode: () => false }));
vi.mock("./call-ringtone", () => ({ startRingtone: () => () => {} }));
vi.mock("./call-panel", () => {
  panel.loaded();
  return { CallPanel: panel.rendered };
});

it("importa e renderiza o painel somente ao sair de idle", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  callSessionStore.idle();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  try {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <CallsProvider>{null}</CallsProvider>
        </QueryClientProvider>,
      );
    });

    expect(getCallSession().phase).toBe("idle");
    expect(panel.loaded).not.toHaveBeenCalled();
    expect(panel.rendered).not.toHaveBeenCalled();

    await act(async () => {
      callSessionStore.error("aviso de teste");
    });
    await act(async () => {
      await vi.dynamicImportSettled();
    });

    expect(panel.loaded).toHaveBeenCalledTimes(1);
    expect(panel.rendered).toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
    host.remove();
    client.clear();
    callSessionStore.idle();
    vi.unstubAllGlobals();
  }
});
