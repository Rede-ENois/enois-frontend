// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CallView } from "@/types/application/call/call-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callSessionStore, getCallSession } from "@/lib/calls/call-session";

import { CallPanel } from "./call-panel";

function ringingCall(): CallView {
  return {
    id: "call_1",
    kind: "AUDIO",
    modality: "DIRECT",
    conversationId: "conv_1",
    groupId: null,
    topicId: null,
    initiatorId: "user_a",
    displayName: "Ana",
    state: "RINGING",
    createdAt: "2026-11-03T12:00:00Z",
    answeredAt: null,
    endedAt: null,
    endReason: null,
    expiresAt: null,
    participantCount: 0,
    isInitiator: true,
    myState: "INVITED",
  };
}

vi.mock("./calls-provider", () => ({
  useCalls: () => ({
    startDirect: vi.fn(),
    startGroup: vi.fn(),
    answer: vi.fn(),
    decline: vi.fn(),
    open: vi.fn(),
    close: () => callSessionStore.idle(),
    call: null,
  }),
  stateLabel: () => "Chamando…",
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("painel da chamada sem servidor de chamadas configurado", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    callSessionStore.idle();
    host = document.createElement("div");
    document.body.append(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    root = createRoot(host);
    const render = () =>
      root.render(
        <QueryClientProvider client={client}>
          <CallPanel />
        </QueryClientProvider>,
      );
    act(render);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
    callSessionStore.idle();
  });

  it("mostra o aviso em vez da moldura de chamada", () => {
    act(() =>
      callSessionStore.error("Ops, ainda estamos configurando tudo por aqui.", {
        notConfigured: true,
      }),
    );
    expect(host.textContent).toContain("Ops, ainda estamos configurando tudo por aqui.");
    expect(host.textContent).toContain("Chamadas em breve");
    // Sem chamada de verdade não há quadro de mídia.
    expect(host.querySelector("iframe")).toBeNull();
  });

  it("o aviso fecha e a tela volta ao normal", () => {
    act(() => callSessionStore.error("Ops…", { notConfigured: true }));
    const dismiss = Array.from(host.querySelectorAll("button")).find((element) =>
      (element.textContent ?? "").includes("Entendi"),
    );
    expect(dismiss).toBeTruthy();
    act(() => dismiss!.click());
    expect(getCallSession().phase).toBe("idle");
    expect(host.textContent).not.toContain("Ops…");
  });

  it("quem entra de fora vê a tela abrir enquanto conecta, sem 'N pessoas'", () => {
    // Entrada do zero (sala do grupo que alguém abriu): a chamada vai junto com o "conectando",
    // senão o clique em "entrar" não muda nada na tela até a credencial chegar.
    act(() => callSessionStore.joining({ ...ringingCall(), modality: "GROUP", state: "ACTIVE" }));
    expect(host.textContent).toContain("Conectando…");
    expect(host.textContent).not.toContain("pessoa");
  });

  it("erro de verdade continua na moldura de erro, não no aviso", () => {
    // Erro real acontece com uma chamada em tela (o painel só existe com ela).
    act(() => callSessionStore.ring(ringingCall(), "calling"));
    act(() => callSessionStore.error("Você não participa desta conversa."));
    expect(host.textContent).toContain("Você não participa desta conversa.");
    expect(host.textContent).not.toContain("Chamadas em breve");
  });
});
