// @vitest-environment jsdom
import { act } from "react";

import type { CallView } from "@/types/application/call/call-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TamoJuntoBar } from "./tamo-junto-bar";

const mocks = vi.hoisted(() => ({
  openCall: null as CallView | null,
  startGroup: vi.fn(() => Promise.resolve()),
  open: vi.fn(() => Promise.resolve()),
}));

vi.mock("./calls-provider", () => ({
  useCalls: () => ({
    startDirect: vi.fn(),
    startGroup: mocks.startGroup,
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
    id: "call_g",
    kind: "AUDIO",
    modality: "GROUP",
    conversationId: null,
    groupId: "grupo_1",
    topicId: null,
    initiatorId: "user_a",
    displayName: "Rapaziada",
    state: "ACTIVE",
    createdAt: "2026-11-03T12:00:00Z",
    answeredAt: null,
    endedAt: null,
    endReason: null,
    expiresAt: null,
    participantCount: 3,
    isInitiator: false,
    myState: "JOINED",
    ...overrides,
  };
}

describe("'Tamo junto' do grupo", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    mocks.openCall = null;
    mocks.startGroup.mockClear();
    mocks.open.mockClear();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<TamoJuntoBar groupId="grupo_1" />));
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
  });

  const button = (label: string) =>
    Array.from(host.querySelectorAll("button")).find((element) =>
      (element.getAttribute("aria-label") ?? element.textContent ?? "").includes(label),
    );

  it("abre a chamada do grupo sem tocar ninguém", () => {
    act(() => button("Tamo junto voz")!.click());
    expect(mocks.startGroup).toHaveBeenCalledWith("grupo_1", "AUDIO", undefined);
  });

  it("a chamada em grupo se chama sempre Tamo junto, com a mídia no nome", () => {
    expect(host.textContent).toContain("Tamo junto voz");
    expect(host.textContent).toContain("Tamo junto vídeo");
    act(() => button("Tamo junto vídeo")!.click());
    expect(mocks.startGroup).toHaveBeenCalledWith("grupo_1", "VIDEO", undefined);
  });

  it("no tópico, a sala é a do tópico", () => {
    act(() => root.render(<></>));
    act(() => root.render(<TamoJuntoBar groupId="grupo_1" topicId="topico_1" topicName="Avisos" />));
    act(() => button("Tamo junto vídeo")!.click());
    expect(mocks.startGroup).toHaveBeenCalledWith("grupo_1", "VIDEO", "topico_1");
  });

  it("com a chamada ao vivo, anuncia o grupo no ar e deixa entrar", () => {
    act(() => root.render(<></>));
    mocks.openCall = call({});
    act(() => root.render(<TamoJuntoBar groupId="grupo_1" />));
    expect(host.textContent).toContain("Tamo junto voz");
    expect(host.textContent).toContain("🔴 O grupo está ao vivo! Entre na chamada quando quiser.");
    expect(host.textContent).toContain("3 pessoas na chamada");
    act(() => button("Entrar na chamada")!.click());
    expect(mocks.open).toHaveBeenCalledWith("call_g");
  });

  it("chamada encerrada volta ao botão de chamar", () => {
    act(() => root.render(<></>));
    mocks.openCall = call({ state: "ENDED" });
    act(() => root.render(<TamoJuntoBar groupId="grupo_1" />));
    expect(host.textContent).not.toContain("ao vivo");
    expect(button("Tamo junto voz")).toBeTruthy();
  });
});
