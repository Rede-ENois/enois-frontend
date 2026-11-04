// @vitest-environment jsdom
import { act } from "react";

import type { CallView } from "@/types/application/call/call-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConversationCallBar } from "./conversation-call-bar";

const mocks = vi.hoisted(() => ({
  openCall: null as CallView | null,
  startDirect: vi.fn(() => Promise.resolve()),
  open: vi.fn(() => Promise.resolve()),
}));

vi.mock("./calls-provider", () => ({
  useCalls: () => ({
    startDirect: mocks.startDirect,
    startGroup: vi.fn(),
    answer: vi.fn(),
    decline: vi.fn(),
    open: mocks.open,
    close: vi.fn(),
    call: mocks.openCall,
  }),
  useOpenCall: () => ({ call: mocks.openCall, isLoading: false }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function call(overrides: Partial<CallView>): CallView {
  return {
    id: "call_1",
    kind: "AUDIO",
    modality: "DIRECT",
    conversationId: "conv_1",
    groupId: null,
    initiatorId: "user_a",
    displayName: "Ana",
    state: "ACTIVE",
    createdAt: "2026-11-03T12:00:00Z",
    answeredAt: null,
    endedAt: null,
    endReason: null,
    expiresAt: null,
    participantCount: 2,
    isInitiator: false,
    myState: "JOINED",
    ...overrides,
  };
}

describe("barra de chamada da conversa", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    mocks.openCall = null;
    mocks.startDirect.mockClear();
    mocks.open.mockClear();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<ConversationCallBar conversationId="conv_1" />));
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
  });

  const button = (label: string) =>
    Array.from(host.querySelectorAll("button")).find((element) =>
      (element.getAttribute("aria-label") ?? element.textContent ?? "").includes(label),
    );

  it("oferece ligar e chamar com vídeo quando não há chamada", () => {
    expect(button("Chamada de áudio")).toBeTruthy();
    expect(button("Chamada de vídeo")).toBeTruthy();
    act(() => button("Chamada de áudio")!.click());
    expect(mocks.startDirect).toHaveBeenCalledWith("conv_1", "AUDIO");
  });

  it("com a chamada ativa, oferece entrar em vez de ligar de novo", () => {
    act(() => root.render(<></>));
    mocks.openCall = call({});
    act(() => root.render(<ConversationCallBar conversationId="conv_1" />));
    expect(button("Entrar na chamada")).toBeTruthy();
    act(() => button("Entrar na chamada")!.click());
    expect(mocks.open).toHaveBeenCalledWith("call_1");
    expect(mocks.startDirect).not.toHaveBeenCalled();
  });

  it("mostra quem está chamando antes do atendimento", () => {
    act(() => root.render(<></>));
    mocks.openCall = call({ state: "RINGING", displayName: "Ana" });
    act(() => root.render(<ConversationCallBar conversationId="conv_1" />));
    expect(host.textContent).toContain("Ana está te chamando");
  });

  it("chamada encerrada volta a mostrar os botões de ligar", () => {
    act(() => root.render(<></>));
    mocks.openCall = call({ state: "ENDED" });
    act(() => root.render(<ConversationCallBar conversationId="conv_1" />));
    expect(button("Chamada de áudio")).toBeTruthy();
  });
});
