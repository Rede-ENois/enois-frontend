// @vitest-environment jsdom
import { type ReactNode, act } from "react";

import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthenticatedAppHeader } from "./authenticated-app-header";

// The server never has /me; the client can find it cached before the header hydrates, which is what
// a parent route (comunidades, vagas) causes.
const currentUser = vi.hoisted(() => ({ data: undefined as { id: string } | undefined }));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => currentUser }));
vi.mock("@rede-enois/design-system/domain", () => ({
  AuthenticatedAppHeader: ({ actions }: { actions: ReactNode }) => <header>{actions}</header>,
}));
vi.mock("@/components/account-menu", () => ({
  AccountMenu: () => <button type="button">Menu da conta</button>,
}));
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => null }));
vi.mock("./global-search", () => ({ GlobalSearch: () => null }));
vi.mock("./notifications-popover", () => ({ NotificationsPopover: () => null }));

describe("authenticated header", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("hydrates without a mismatch and shows the account menu after mount", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const host = document.createElement("div");
    host.innerHTML = renderToString(<AuthenticatedAppHeader />);
    document.body.append(host);
    expect(host.textContent).not.toContain("Menu da conta");
    currentUser.data = { id: "user-1" };

    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(host, <AuthenticatedAppHeader />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(host.textContent).toContain("Menu da conta");
  });
});
