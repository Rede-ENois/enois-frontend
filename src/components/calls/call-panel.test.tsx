// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
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
    eventId: null,
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

const actions = vi.hoisted(() => ({
  answer: vi.fn(),
  decline: vi.fn(),
  leaveFromRoom: vi.fn(async () => {}),
}));

vi.mock("./calls-provider", () => ({
  useCalls: () => ({
    startDirect: vi.fn(),
    startGroup: vi.fn(),
    answer: actions.answer,
    decline: actions.decline,
    open: vi.fn(),
    leaveFromRoom: actions.leaveFromRoom,
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
    // A altura é `dvh`, não `inset-0`: no celular a barra do navegador aparece e some, e com
    // `inset-0` o rodapé da sala ficava atrás dela. `dvh` acompanha a área visível.
    expect(dialog!.className).toContain("inset-x-0");
    expect(dialog!.className).toContain("top-0");
    expect(dialog!.className).toContain("h-[100dvh]");
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
    expect(dialog!.className).toContain("h-[100dvh]");
  });
});

describe("a pessoa desligou por dentro da sala", () => {
  let root: Root;
  let host: HTMLDivElement;

  function liveCall() {
    return { ...ringingCall(), state: "ACTIVE" as const };
  }

  beforeEach(() => {
    callSessionStore.idle();
    actions.leaveFromRoom.mockClear();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <CallPanel />
        </QueryClientProvider>,
      ),
    );
    act(() =>
      callSessionStore.live({
        callId: "call_1",
        kind: "AUDIO",
        modality: "DIRECT",
        host: "https://meet.enois.ia.br",
        tokenTtlSeconds: 7200,
        room: "sala-1",
        jwt: "token",
        call: liveCall(),
      }),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
    callSessionStore.idle();
  });

  it("o aviso da sala fecha o painel e avisa o servidor, sem reconectar", () => {
    const frame = host.querySelector("iframe")!;
    const source = frame.contentWindow;
    expect(source).not.toBeNull();

    // O Epapo avisa por postMessage, na mesma origem do iframe. Sem isso o painel ficava aberto
    // achando que a pessoa estava na sala, e reconectar reabria a chamada que ela encerrou.
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "enois:call-room-exit" },
          origin: "https://meet.enois.ia.br",
          source: source as MessageEventSource,
        }),
      );
    });

    expect(actions.leaveFromRoom).toHaveBeenCalledWith("call_1", undefined);
    // Fechar e reconectar são coisas diferentes: nenhum pedido de credencial nova aqui.
    expect(getCallSession().needsCredential).toBe(false);
  });

  it("um aviso de outra origem não fecha a chamada", () => {
    const frame = host.querySelector("iframe")!;
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "enois:call-room-exit" },
          origin: "https://outro.exemplo",
          source: frame.contentWindow as MessageEventSource,
        }),
      );
    });
    expect(actions.leaveFromRoom).not.toHaveBeenCalled();
  });
});

describe("minimizar preserva o iframe", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    for (const held of [...getCallSession().waiting]) callSessionStore.removeWaiting(held.id);
    callSessionStore.idle();
    actions.leaveFromRoom.mockClear();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <CallPanel />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
    for (const held of [...getCallSession().waiting]) callSessionStore.removeWaiting(held.id);
    callSessionStore.idle();
  });

  function enter(kind: "AUDIO" | "VIDEO" = "AUDIO") {
    act(() =>
      callSessionStore.live({
        callId: "call_1",
        kind,
        modality: "DIRECT",
        host: "https://meet.enois.ia.br",
        tokenTtlSeconds: 7200,
        room: "sala-1",
        jwt: "token",
        call: { ...ringingCall(), kind, state: "ACTIVE" },
      }),
    );
    return host.querySelector("iframe")!;
  }

  it.each(["AUDIO", "VIDEO"] as const)(
    "%s mantém a mesma janela em quatro ciclos",
    async (kind) => {
      const frames: HTMLIFrameElement[] = [];
      const removed: HTMLIFrameElement[] = [];
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const [nodes, target] of [
            [record.addedNodes, frames],
            [record.removedNodes, removed],
          ] as const) {
            for (const node of nodes) {
              if (node instanceof HTMLIFrameElement) target.push(node);
              else if (node instanceof Element) target.push(...node.querySelectorAll("iframe"));
            }
          }
        }
      });
      observer.observe(host, { childList: true, subtree: true });
      try {
        const frame = enter(kind);
        const source = frame.contentWindow;
        const join = getCallSession().join;
        const url = frame.src;
        for (let cycle = 0; cycle < 4; cycle++) {
          act(() =>
            host
              .querySelector<HTMLButtonElement>(`[aria-label="${texts.calls.minimize}"]`)!
              .click(),
          );
          expect(host.querySelector("iframe")).toBe(frame);
          expect(frame.isConnected).toBe(true);
          expect(getCallSession()).toMatchObject({
            phase: "live",
            minimized: true,
            needsCredential: false,
          });
          const pill = Array.from(host.querySelectorAll("button")).find((button) =>
            button.textContent?.includes(
              kind === "VIDEO" ? texts.calls.videoTitle : texts.calls.audioTitle,
            ),
          )!;
          act(() => pill.click());
          expect(host.querySelector("iframe")).toBe(frame);
          expect(frame.contentWindow).toBe(source);
          expect(frame.src).toBe(url);
          expect(getCallSession().join).toBe(join);
          expect(getCallSession()).toMatchObject({
            phase: "live",
            minimized: false,
            needsCredential: false,
            needsRejoin: false,
          });
        }
        await Promise.resolve();
        expect(frames).toEqual([frame]);
        expect(removed).toEqual([]);
        expect(actions.leaveFromRoom).not.toHaveBeenCalled();
      } finally {
        observer.disconnect();
      }
    },
  );

  it("não prende o foco nem mantém um modal ao minimizar", () => {
    const outside = document.createElement("button");
    document.body.prepend(outside);
    enter();
    act(() =>
      host.querySelector<HTMLButtonElement>(`[aria-label="${texts.calls.minimize}"]`)!.click(),
    );
    const frame = host.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame!.closest("[inert]")).not.toBeNull();
    expect(host.querySelector('[aria-modal="true"]')).toBeNull();
    expect(document.activeElement?.closest("[inert]")).toBeNull();
    outside.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(outside);
  });

  it("mantém a recuperação minimizada sem tirar o foco da página", () => {
    const outside = document.createElement("button");
    document.body.prepend(outside);
    const frame = enter();
    const renewed = { ...getCallSession().join!, jwt: "token_renovado" };
    act(() => callSessionStore.minimize());
    const pill = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === texts.calls.audioTitle,
    )!;
    outside.focus();

    act(() => callSessionStore.lostCredential());
    expect(getCallSession()).toMatchObject({
      phase: "joining",
      minimized: true,
      needsCredential: true,
    });
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(pill.isConnected).toBe(true);
    expect(document.activeElement).toBe(outside);
    expect(frame.isConnected).toBe(false);

    act(() => callSessionStore.credentialConsumed());
    act(() => callSessionStore.joining(renewed.call));
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(outside);

    act(() => callSessionStore.live(renewed));
    const recoveredFrame = host.querySelector("iframe")!;
    expect(recoveredFrame).not.toBeNull();
    expect(recoveredFrame).not.toBe(frame);
    expect(recoveredFrame.closest("[inert]")).not.toBeNull();
    expect(getCallSession()).toMatchObject({
      phase: "live",
      minimized: true,
      needsCredential: false,
    });
    expect(pill.isConnected).toBe(true);
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(outside);

    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
    expect(actions.leaveFromRoom).not.toHaveBeenCalled();

    act(() => pill.click());
    const dialog = host.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(host.querySelector("iframe")).toBe(recoveredFrame);
  });

  it("preserva o botão da pílula e seu foco durante a recuperação", () => {
    enter();
    act(() => callSessionStore.minimize());
    const pill = document.activeElement;
    expect(pill?.textContent).toBe(texts.calls.audioTitle);
    const renewed = { ...getCallSession().join!, jwt: "token_renovado" };
    act(() => callSessionStore.lostCredential());
    expect(document.activeElement).toBe(pill);
    expect(pill?.isConnected).toBe(true);
    act(() => callSessionStore.live(renewed));
    expect(document.activeElement).toBe(pill);
    expect(pill?.isConnected).toBe(true);
  });

  it("mostra erro de recuperação sem prender o foco da página", () => {
    const outside = document.createElement("button");
    document.body.prepend(outside);
    enter();
    act(() => callSessionStore.minimize());
    outside.focus();
    act(() => callSessionStore.lostCredential());
    act(() => callSessionStore.error("Falha na recuperação da chamada."));
    expect(host.textContent).toContain("Falha na recuperação da chamada.");
    expect(host.querySelector('[aria-modal="true"]')).toBeNull();
    expect(host.querySelector('[role="dialog"]')?.closest("[inert]")).toBeNull();
    expect(host.querySelector("iframe")).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it("receber outra chamada e atualizar a presença preserva a sala minimizada", () => {
    const frame = enter();
    act(() => callSessionStore.minimize());
    act(() =>
      callSessionStore.ring({ ...ringingCall(), id: "call_2", isInitiator: false }, "incoming"),
    );
    act(() => callSessionStore.update({ ...getCallSession().call!, participantCount: 2 }));
    expect(host.querySelector("iframe")).toBe(frame);
    expect(getCallSession()).toMatchObject({
      phase: "live",
      minimized: true,
      call: { id: "call_1" },
      waiting: [{ id: "call_2" }],
    });
    expect(actions.answer).not.toHaveBeenCalled();
    expect(actions.leaveFromRoom).not.toHaveBeenCalled();
  });

  it("continua escutando a saída da sala minimizada", () => {
    const frame = enter();
    const source = frame.contentWindow;
    act(() => callSessionStore.minimize());
    act(() =>
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "enois:call-room-exit", reason: "hangup" },
          origin: "https://meet.enois.ia.br",
          source: source as MessageEventSource,
        }),
      ),
    );
    expect(actions.leaveFromRoom).toHaveBeenCalledExactlyOnceWith("call_1", "hangup");
    expect(getCallSession().needsCredential).toBe(false);
  });

  it("encerramento remoto remove o iframe minimizado", () => {
    const frame = enter();
    act(() => callSessionStore.minimize());
    act(() => callSessionStore.ended({ ...ringingCall(), state: "ENDED" }));
    expect(frame.isConnected).toBe(false);
    expect(host.querySelector("iframe")).toBeNull();
    expect(getCallSession()).toMatchObject({ phase: "ended", join: null, needsCredential: false });
  });
});
