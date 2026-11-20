// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Espaço entre os blocos de uma página (issue #1110): cabeçalho, barra de ações e a grade logo
 * abaixo encostavam uns nos outros. O espaço mora no `main` da casca, então vale para toda rota.
 */
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: null }) }));
vi.mock("@/lib/use-presence-heartbeat", () => ({ usePresenceHeartbeat: () => undefined }));
vi.mock("@/components/app-sidebar", () => ({ AppSidebar: () => null }));
vi.mock("@/components/authenticated-app-header", () => ({
  AuthenticatedAppHeader: () => null,
}));
vi.mock("@/components/mobile-dock", () => ({ MobileDock: () => null }));
vi.mock("@/components/navigation-drawer", () => ({ NavigationDrawer: () => null }));
vi.mock("@/components/notices/admin-notice", () => ({ AdminNoticeBanner: () => null }));

const { AppContainer } = await import("./app-container");

describe("casca do app", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("separa os blocos da página na vertical", async () => {
    await act(async () => {
      root.render(
        <AppContainer>
          <header>cabeçalho</header>

          <section>grade</section>
        </AppContainer>,
      );
    });

    const main = host.querySelector("main");
    expect(main).not.toBeNull();
    // O espaço vem do `gap` do Main do design system, não de um wrapper de markup na casca.
    expect(main?.className.split(/\s+/)).toContain("space-y-4");
  });
});
