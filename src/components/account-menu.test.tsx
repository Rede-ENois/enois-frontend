// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Profile } from "@/types/application/profile/profile";
import type { AccountMenuProps as AccountMenuViewProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountMenu } from "./account-menu";

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));

vi.mock("@/lib/logout", () => ({ logout: vi.fn() }));
vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

// The DS menu is replaced by a probe: under test is the contract the app feeds into it.
vi.mock("@rede-enois/design-system/domain", () => ({
  AccountMenu: ({ open, onOpenChange, hrefs }: AccountMenuViewProps) => (
    <div data-open={String(open)}>
      {hrefs.notificationPreferences && <a href={hrefs.notificationPreferences}>Notificações</a>}

      <a href={hrefs.corporateProfile}>Perfil profissional</a>

      <button type="button" onClick={() => onOpenChange(true)}>
        Abrir menu
      </button>
    </div>
  ),
}));

vi.mock("./change-email-dialog", () => ({ ChangeEmailDialog: () => null }));
vi.mock("./change-password-dialog", () => ({ ChangePasswordDialog: () => null }));
vi.mock("./delete-account-dialog", () => ({ DeleteAccountDialog: () => null }));
vi.mock("./healthy-usage/healthy-usage-dialog", () => ({ HealthyUsageDialog: () => null }));
vi.mock("./linked-accounts-dialog", () => ({ LinkedAccountsDialog: () => null }));
vi.mock("./push-toggle", () => ({ PushToggle: () => null }));
vi.mock("@/lib/interface-context", () => ({
  useInterfaceContext: () => "SOCIAL" as const,
  writeStoredContext: vi.fn(),
  destinationAfterSwitch: () => null,
  professionalReady: () => false,
}));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  hasSessionFlag: () => true,
}));

const perfil = {
  id: "user_1",
  username: "eu",
  name: "Eu",
  email: "eu@exemplo.test",
  avatar: null,
} as Profile;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

const botao = (nome: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === nome,
  );

describe("menu da conta", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    mocks.toast.mockReset();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const montar = async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu profile={perfil} />
        </QueryClientProvider>,
      );
    });
    await flush();
  };

  it("leva às preferências de notificação e ao perfil profissional", async () => {
    await montar();

    expect(host.querySelector('a[href="/notificacoes/preferencias"]')).not.toBeNull();
    expect(host.querySelector('a[href="/profissional"]')).not.toBeNull();
  });

  it("abre pelo gatilho", async () => {
    await montar();
    act(() => botao("Abrir menu")?.click());
    await flush();

    expect(host.querySelector("[data-open]")?.getAttribute("data-open")).toBe("true");
  });
});
