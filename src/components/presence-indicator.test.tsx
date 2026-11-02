// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PresenceIndicator } from "./presence-indicator";

const mocks = vi.hoisted(() => ({ own: vi.fn(), byUsername: vi.fn(), set: vi.fn() }));

vi.mock("@/lib/api/presence", () => ({
  presenceApi: { own: mocks.own, byUsername: mocks.byUsername, set: mocks.set },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

const option = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find((button) =>
    button.textContent?.includes(label),
  );

describe("indicador de presença", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    mocks.own.mockReset();
    mocks.byUsername.mockReset();
    mocks.set.mockReset();
    host = document.createElement("div");
    document.body.appendChild(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
    document.body.innerHTML = "";
  });

  const render = async (isOwn: boolean) => {
    await act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <PresenceIndicator username="mel" isOwn={isOwn} />
        </QueryClientProvider>,
      ),
    );
    await flush();
  };

  it("para o titular, mostra o estado e deixa trocar", async () => {
    mocks.own.mockResolvedValue({ status: "AVAILABLE" });
    mocks.set.mockResolvedValue({ status: "DO_NOT_DISTURB" });
    await render(true);

    const trigger = host.querySelector("button");
    expect(trigger?.getAttribute("aria-label")).toBe(
      `${texts.presence.change}: ${texts.presence.options.AVAILABLE.label}`,
    );

    await act(() => trigger?.click());
    await act(() => option(texts.presence.options.DO_NOT_DISTURB.label)?.click());
    await flush();

    expect(mocks.set).toHaveBeenCalledWith("DO_NOT_DISTURB");
  });

  it("para outras pessoas, mostra só o estado público, sem botão", async () => {
    mocks.byUsername.mockResolvedValue({ status: "AWAY" });
    await render(false);

    expect(host.querySelector("button")).toBeNull();
    const readOnly = host.querySelector('[role="img"]');
    expect(readOnly?.getAttribute("aria-label")).toBe(texts.presence.publicStatus.AWAY);
    expect(mocks.byUsername).toHaveBeenCalledWith("mel");
  });

  it("mantém o painel aberto e avisa quando a troca falha", async () => {
    mocks.own.mockResolvedValue({ status: "AVAILABLE" });
    mocks.set.mockRejectedValue(new Error("500"));
    await render(true);

    await act(() => host.querySelector("button")?.click());
    await act(() => option(texts.presence.options.AWAY.label)?.click());
    await flush();

    expect(document.querySelector('[role="alert"]')?.textContent).toBe(texts.presence.updateError);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("cai no aviso de indisponível quando a API não responde", async () => {
    mocks.own.mockRejectedValue(new Error("404"));
    await render(true);

    const fallback = host.querySelector('[role="img"]');
    expect(fallback?.getAttribute("aria-label")).toBe(texts.presence.unavailable);
    expect(host.querySelector("button")).toBeNull();
  });
});
