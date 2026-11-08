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

const actions = vi.hoisted(() => ({ answer: vi.fn(), decline: vi.fn() }));

vi.mock("./calls-provider", () => ({
  useCalls: () => ({
    startDirect: vi.fn(),
    startGroup: vi.fn(),
    answer: actions.answer,
    decline: actions.decline,
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

describe("chamada recebida em tela cheia", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const incoming = (overrides: Partial<CallView> = {}): CallView => ({
    ...ringingCall(),
    isInitiator: false,
    ...overrides,
  });

  const button = (label: string) =>
    Array.from(host.querySelectorAll("button")).find((element) =>
      (element.textContent ?? "").includes(label),
    );

  beforeEach(() => {
    actions.answer.mockClear();
    actions.decline.mockClear();
    callSessionStore.idle();
    host = document.createElement("div");
    document.body.append(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    root = createRoot(host);
    act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <CallPanel />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
    callSessionStore.idle();
  });

  it("ocupa a tela inteira, como um discador", () => {
    act(() => callSessionStore.ring(incoming(), "incoming"));
    const dialog = host.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog!.className).toContain("inset-0");
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
  });

  it("mostra quem liga e as duas saídas, sem atender sozinho", () => {
    act(() => callSessionStore.ring(incoming(), "incoming"));
    expect(host.textContent).toContain("Ana");
    expect(button("Atender")).toBeTruthy();
    expect(button("Recusar")).toBeTruthy();
    // Nada de atender sem clique: a decisão é de quem recebe.
    expect(actions.answer).not.toHaveBeenCalled();
    expect(getCallSession().phase).toBe("incoming");
  });

  it("recusar chama a recusa e não atende", () => {
    act(() => callSessionStore.ring(incoming(), "incoming"));
    act(() => button("Recusar")!.click());
    expect(actions.decline).toHaveBeenCalledTimes(1);
    expect(actions.answer).not.toHaveBeenCalled();
  });

  it("atender chama o atendimento", () => {
    act(() => callSessionStore.ring(incoming(), "incoming"));
    act(() => button("Atender")!.click());
    expect(actions.answer).toHaveBeenCalledTimes(1);
  });

  it("a chamada que já estava na tela aparece e pode ser atendida dali", () => {
    act(() => callSessionStore.ring(ringingCall(), "calling"));
    act(() => callSessionStore.ring(incoming({ id: "call_2", displayName: "Bia" }), "incoming"));
    // A de cima continua na tela; a nova espera e é anunciada pelo nome.
    expect(host.textContent).toContain("A seguir: Bia");
    expect(getCallSession().call?.id).toBe("call_1");
  });

  it("com duas chamadas, cada botão diz de quem é a chamada", () => {
    for (const held of [...getCallSession().waiting]) callSessionStore.removeWaiting(held.id);
    act(() => callSessionStore.ring(incoming(), "incoming"));
    act(() => callSessionStore.ring(incoming({ id: "call_2", displayName: "Bia" }), "incoming"));
    const labels = Array.from(host.querySelectorAll("button"))
      .filter((element) => /Recusar|Atender/.test(element.textContent ?? ""))
      .map((element) => element.getAttribute("aria-label"));
    expect(labels).toEqual([
      "Recusar a chamada de Ana",
      "Atender a chamada de Ana",
      "Recusar a chamada de Bia",
      "Atender a chamada de Bia",
    ]);
    act(() => callSessionStore.removeWaiting("call_2"));
  });

  it("em tela cheia o foco entra no painel e o Tab não sai dele", () => {
    const outside = document.createElement("button");
    document.body.prepend(outside);
    outside.focus();
    act(() => callSessionStore.ring(incoming(), "incoming"));
    const dialog = host.querySelector<HTMLElement>('[role="dialog"]')!;
    const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button"));
    expect(document.activeElement).toBe(buttons[0]);

    buttons[buttons.length - 1].focus();
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[0]);

    const back = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(back);
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);

    // Fechou: o foco volta para onde estava.
    act(() => callSessionStore.idle());
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("a chamada ao vivo também abre em tela cheia", () => {
    act(() => callSessionStore.ring(ringingCall(), "calling"));
    act(() =>
      callSessionStore.live({
        callId: "call_1",
        kind: "AUDIO",
        modality: "DIRECT",
        host: "https://meet.enois.ia.br",
        tokenTtlSeconds: 7200,
        room: "sala-1",
        jwt: "token",
        call: { ...ringingCall(), state: "ACTIVE" },
      }),
    );
    const dialog = host.querySelector('[role="dialog"]');
    expect(dialog!.className).toContain("inset-0");
  });
});
