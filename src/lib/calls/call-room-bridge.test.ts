// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { ROOM_EXIT, subscribeToRoomExit } from "./call-room-bridge";

const ORIGIN = "https://meet.enois.ia.br";

/** Iframe de mentira: só o que a ponte usa (`src` e `contentWindow`). */
function fakeFrame(origin = ORIGIN) {
  const frame = {
    src: `${origin}/sala?jwt=abc`,
    contentWindow: {} as Window,
  } as unknown as HTMLIFrameElement;
  return { frame, target: frame.contentWindow as unknown as Window };
}

function post(data: unknown, options: { origin?: string; source?: Window | null } = {}) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data,
      origin: options.origin ?? ORIGIN,
      source:
        options.source === undefined ? null : (options.source as unknown as MessageEventSource),
    }),
  );
}

describe("aviso de saída da sala", () => {
  let unsubscribe: (() => void) | undefined;

  afterEach(() => {
    unsubscribe?.();
    unsubscribe = undefined;
  });

  it("a sala avisou que a pessoa saiu, e o painel fica sabendo", () => {
    const { frame, target } = fakeFrame();
    const onExit = vi.fn();
    unsubscribe = subscribeToRoomExit(frame, onExit);
    post({ type: ROOM_EXIT }, { source: target });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("aceita o aviso sem motivo e corta o motivo comprido", () => {
    const { frame, target } = fakeFrame();
    const onExit = vi.fn();
    unsubscribe = subscribeToRoomExit(frame, onExit);
    post({ type: ROOM_EXIT, reason: "x".repeat(200) }, { source: target });
    expect(onExit.mock.calls[0][0].reason).toHaveLength(64);
  });

  it("aviso de outra origem é ignorado", () => {
    const { frame, target } = fakeFrame();
    const onExit = vi.fn();
    unsubscribe = subscribeToRoomExit(frame, onExit);
    post({ type: ROOM_EXIT }, { source: target, origin: "https://outro.exemplo" });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("aviso de outra janela é ignorado, mesmo vindo da origem certa", () => {
    const { frame } = fakeFrame();
    const onExit = vi.fn();
    unsubscribe = subscribeToRoomExit(frame, onExit);
    post({ type: ROOM_EXIT }, { source: { other: true } as unknown as Window });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("mensagem da sala que não é o aviso de saída não fecha nada", () => {
    const { frame, target } = fakeFrame();
    const onExit = vi.fn();
    unsubscribe = subscribeToRoomExit(frame, onExit);
    post({ type: "enois:call-capture-response", image: "data:," }, { source: target });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("sem iframe não há o que escutar", () => {
    const onExit = vi.fn();
    unsubscribe = subscribeToRoomExit(null, onExit);
    post({ type: ROOM_EXIT });
    expect(onExit).not.toHaveBeenCalled();
  });
});
