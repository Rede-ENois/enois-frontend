// @vitest-environment jsdom
import { type ReactNode, act } from "react";

import { useAppShellStore } from "@/stores/app-shell.store";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NavigationDrawer } from "./navigation-drawer";

// O efeito em teste não depende da view do design system nem dos links: mockar a camada visual mantém o
// teste no contrato (cruzar 1024px fecha a store) sem exigir browser real. O scroll/focus
// do Radix é provado à parte, no navegador.
vi.mock("./navigation-links", () => ({ NavigationLinks: () => <nav /> }));
vi.mock("@rede-enois/design-system/domain", () => ({ AppBrand: () => <span /> }));
vi.mock("@rede-enois/design-system/patterns", () => ({
  NavigationDrawer: ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
}));

describe("drawer de navegação no desktop", () => {
  let root: Root;
  let host: HTMLDivElement;
  let mounted: boolean;
  let listeners: Set<(event: MediaQueryListEvent) => void>;
  let removeEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mounted = false;
    listeners = new Set();
    removeEventListener = vi.fn((_: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
          listeners.add(listener),
        removeEventListener,
      })),
    );

    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    useAppShellStore.setState({ mobileNavigationOpen: true });
  });

  afterEach(async () => {
    await unmount();
    host.remove();
    useAppShellStore.setState({ mobileNavigationOpen: false });
    vi.unstubAllGlobals();
  });

  async function renderDrawer() {
    mounted = true;
    await act(async () => root.render(<NavigationDrawer />));
  }

  async function unmount() {
    if (!mounted) return;
    mounted = false;
    await act(async () => root.unmount());
  }

  function emit(matches: boolean) {
    for (const listener of listeners) {
      listener({ matches } as MediaQueryListEvent);
    }
  }

  it("usa o mesmo limite de 64rem do lg do Tailwind", async () => {
    await renderDrawer();

    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 64rem)");
  });

  it("fecha o drawer quando o viewport cruza para o desktop", async () => {
    await renderDrawer();

    act(() => emit(true));

    expect(useAppShellStore.getState().mobileNavigationOpen).toBe(false);
  });

  it("mantém o drawer aberto enquanto o viewport está abaixo do limite", async () => {
    await renderDrawer();

    act(() => emit(false));

    expect(useAppShellStore.getState().mobileNavigationOpen).toBe(true);
  });

  it("remove a escuta ao desmontar", async () => {
    await renderDrawer();

    await unmount();

    expect(removeEventListener).toHaveBeenCalled();
    expect(listeners.size).toBe(0);
  });
});
