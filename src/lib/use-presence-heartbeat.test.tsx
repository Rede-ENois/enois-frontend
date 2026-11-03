// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePresenceHeartbeat } from "./use-presence-heartbeat";

const mocks = vi.hoisted(() => ({ heartbeat: vi.fn(), hasSessionFlag: vi.fn() }));

vi.mock("@/lib/api/presence", () => ({ presenceApi: { heartbeat: mocks.heartbeat } }));
vi.mock("@/lib/session", () => ({ hasSessionFlag: mocks.hasSessionFlag }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
  usePresenceHeartbeat();
  return null;
}

const flush = () =>
  act(async () => {
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("heartbeat de presença", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    mocks.heartbeat.mockReset();
    mocks.hasSessionFlag.mockReset();
    host = document.createElement("div");
    document.body.appendChild(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
  });

  const render = async () => {
    await act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      ),
    );
    await flush();
  };

  it("avisa o servidor uma vez por sessão montada", async () => {
    mocks.hasSessionFlag.mockReturnValue(true);
    mocks.heartbeat.mockResolvedValue(undefined);
    await render();

    expect(mocks.heartbeat).toHaveBeenCalledTimes(1);
  });

  it("não chama a API sem sessão", async () => {
    mocks.hasSessionFlag.mockReturnValue(false);
    await render();

    expect(mocks.heartbeat).not.toHaveBeenCalled();
  });

  it("não repete a chamada em laço quando a API falha", async () => {
    mocks.hasSessionFlag.mockReturnValue(true);
    mocks.heartbeat.mockRejectedValue(new Error("401"));
    await render();

    expect(mocks.heartbeat).toHaveBeenCalledTimes(1);
  });
});
