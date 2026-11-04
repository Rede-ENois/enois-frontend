// @vitest-environment jsdom
import { act } from "react";

import { useAppShellStore } from "@/stores/app-shell.store";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useRouterState: () => "/mensagens",
}));
vi.mock("@/lib/navigation-signals", () => ({
  signalFor: () => null,
  useNavigationCounts: () => ({}),
}));
// The DS dock is a probe: under test is whether the container draws it.
vi.mock("@rede-enois/design-system/patterns", () => ({
  MobileDock: () => <nav data-testid="dock" />,
}));

const { MobileDock } = await import("./mobile-dock");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("MobileDock", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement("div");
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    act(() => useAppShellStore.getState().setConversationOpen(false));
  });

  it("steps aside while a conversation is open, so it never covers the composer", () => {
    act(() => useAppShellStore.getState().setConversationOpen(true));
    act(() => root.render(<MobileDock />));

    expect(host.querySelector('[data-testid="dock"]')).toBeNull();
  });

  it("comes back on the conversation list and everywhere else", () => {
    act(() => root.render(<MobileDock />));

    expect(host.querySelector('[data-testid="dock"]')).not.toBeNull();
  });
});
