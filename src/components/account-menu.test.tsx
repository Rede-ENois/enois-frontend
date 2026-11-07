// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";
import type { AccountMenuProps as AccountMenuViewProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountMenu } from "./account-menu";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  me: vi.fn(),
  moderatorMe: vi.fn(),
  wallet: vi.fn(),
  navigate: vi.fn(),
  writeStoredContext: vi.fn(),
  destination: null as string | null,
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));

vi.mock("@/lib/api", () => ({
  corporateApi: { me: mocks.me },
  moderationApi: { me: mocks.moderatorMe },
  walletApi: { wallet: mocks.wallet },
}));
vi.mock("@/components/theme-toggle", () => ({ ThemeSwitch: () => <span>tema</span> }));

vi.mock("@/lib/logout", () => ({ logout: vi.fn() }));
vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

// The DS menu is replaced by a probe: under test is the contract the app feeds into it.
vi.mock("@rede-enois/design-system/domain", () => ({
  AccountMenu: ({ open, onOpenChange, hrefs, identitySlot, walletLabel }: AccountMenuViewProps) => (
    <div data-open={String(open)}>
      {identitySlot}

      <span data-wallet>{walletLabel}</span>

      {hrefs.moderator && <a href={hrefs.moderator}>Painel de moderador</a>}

      <a href={hrefs.account}>Conta e segurança</a>

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
vi.mock("@/lib/interface-context", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/interface-context")>()),
  useInterfaceContext: () => "SOCIAL" as const,
  writeStoredContext: mocks.writeStoredContext,
  destinationAfterSwitch: () => mocks.destination,
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
    mocks.me.mockReset();
    mocks.navigate.mockReset();
    mocks.writeStoredContext.mockReset();
    mocks.destination = null;
    mocks.me.mockResolvedValue({ exists: false, status: "NONE" });
    mocks.moderatorMe.mockReset();
    mocks.moderatorMe.mockResolvedValue({ moderator: false, admin: false });
    mocks.wallet.mockReset();
    mocks.wallet.mockResolvedValue({ balance: 1240 });
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

  const abrir = async () => {
    act(() => botao("Abrir menu")?.click());
    await flush();
  };

  it("shows the moderator panel only to whoever moderates", async () => {
    await montar();
    await abrir();
    expect(host.querySelector('a[href="/moderador"]')).toBeNull();

    act(() => root.unmount());
    root = createRoot(host);
    mocks.moderatorMe.mockResolvedValue({ moderator: true, admin: false });
    await montar();
    await abrir();
    expect(host.querySelector('a[href="/moderador"]')).not.toBeNull();
  });

  it("shows the wallet balance once the menu opens", async () => {
    await montar();
    expect(mocks.wallet).not.toHaveBeenCalled();

    await abrir();
    expect(host.querySelector("[data-wallet]")?.textContent).toBe("1 faísca 240 fagulhas");
  });

  it("sends the account items to the Conta e segurança page (#562)", async () => {
    await montar();

    expect(host.querySelector('a[href="/conta"]')).not.toBeNull();
  });

  it("com perfil profissional ativo mostra a escolha de identidade", async () => {
    mocks.me.mockResolvedValue({ exists: true, status: "ACTIVE", username: "pro", name: "Pro" });
    await montar();

    expect(botao("Profissional")).toBeDefined();
    expect(host.textContent).not.toContain(texts.account.menu.identityLoadError);
  });

  it("diz em qual perfil o menu está, para a troca de opções não parecer bug", async () => {
    mocks.me.mockResolvedValue({ exists: true, status: "ACTIVE", username: "pro", name: "Pro" });
    await montar();

    expect(host.textContent).toContain(texts.account.menu.activeIdentity.SOCIAL);
    expect(host.textContent).not.toContain(texts.account.menu.activeIdentity.PROFESSIONAL);
  });

  it("switching says the side menu changed and navigates without reloading the page", async () => {
    mocks.me.mockResolvedValue({ exists: true, status: "ACTIVE", username: "pro", name: "Pro" });
    mocks.destination = "/feed";
    await montar();

    act(() => botao("Profissional")?.click());

    expect(mocks.writeStoredContext).toHaveBeenCalledWith("PROFESSIONAL");
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/feed" });
    expect(mocks.toast).toHaveBeenCalledWith(texts.account.menu.switchedTo.PROFESSIONAL);
  });

  it("choosing the interface already on does nothing", async () => {
    mocks.me.mockResolvedValue({ exists: true, status: "ACTIVE", username: "pro", name: "Pro" });
    await montar();

    act(() => botao("Social")?.click());

    expect(mocks.writeStoredContext).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("sem perfil profissional não anuncia perfil social: não há o que alternar", async () => {
    await montar();

    expect(host.textContent).not.toContain(texts.account.menu.activeIdentity.SOCIAL);
  });

  it("sem perfil profissional não mostra identidade nem erro", async () => {
    await montar();

    expect(botao("Profissional")).toBeUndefined();
    expect(host.textContent).not.toContain(texts.account.menu.identityLoadError);
  });

  it("quando a consulta do perfil profissional falha avisa e deixa tentar de novo", async () => {
    mocks.me.mockRejectedValueOnce(new Error("offline"));
    await montar();

    expect(host.textContent).toContain(texts.account.menu.identityLoadError);
    expect(botao("Profissional")).toBeUndefined();

    mocks.me.mockResolvedValue({ exists: true, status: "ACTIVE", username: "pro", name: "Pro" });
    act(() => botao(texts.account.menu.identityRetry)?.click());
    await flush();

    expect(host.textContent).not.toContain(texts.account.menu.identityLoadError);
    expect(botao("Profissional")).toBeDefined();
  });

  it("abre pelo gatilho", async () => {
    await montar();
    act(() => botao("Abrir menu")?.click());
    await flush();

    expect(host.querySelector("[data-open]")?.getAttribute("data-open")).toBe("true");
  });
});
