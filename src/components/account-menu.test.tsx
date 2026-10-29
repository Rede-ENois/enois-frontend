// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CorporateProfileView } from "@/types/application/corporate/corporate-profile-view";
import type { Profile } from "@/types/application/profile/profile";
import type { AccountMenuProps as AccountMenuViewProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountMenu } from "./account-menu";

const mocks = vi.hoisted(() => ({ me: vi.fn(), toast: vi.fn() }));

vi.mock("@/lib/api", () => ({ corporateApi: { me: mocks.me } }));
vi.mock("@/lib/logout", () => ({ logout: vi.fn() }));
vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

// Fiel ao AccountMenu do design system: a seção "Identidade" existe só quando o app manda, a opção
// profissional respeita o enabled e cada opção devolve a escolha pela callback. O que está sob
// teste é o contrato que o app cumpre.
vi.mock("@rede-enois/design-system/domain", () => ({
  AccountMenu: ({
    open,
    showIdentitySwitch,
    corporateIdentityEnabled,
    identity,
    onChooseIdentity,
    onOpenChange,
  }: AccountMenuViewProps) => (
    <div data-open={String(open)} data-identity={identity}>
      <button type="button" onClick={() => onOpenChange(true)}>
        Abrir menu
      </button>

      {showIdentitySwitch && (
        <div>
          <p>Identidade</p>

          <button type="button" onClick={() => onChooseIdentity("SOCIAL")}>
            Social
          </button>

          <button
            type="button"
            disabled={!corporateIdentityEnabled}
            onClick={() => onChooseIdentity("CORPORATE")}
          >
            Profissional
          </button>
        </div>
      )}
    </div>
  ),
}));

vi.mock("./change-email-dialog", () => ({ ChangeEmailDialog: () => null }));
vi.mock("./change-password-dialog", () => ({ ChangePasswordDialog: () => null }));
vi.mock("./delete-account-dialog", () => ({ DeleteAccountDialog: () => null }));
vi.mock("./healthy-usage/healthy-usage-dialog", () => ({ HealthyUsageDialog: () => null }));
vi.mock("./linked-accounts-dialog", () => ({ LinkedAccountsDialog: () => null }));
vi.mock("./push-toggle", () => ({ PushToggle: () => null }));

const perfil = {
  id: "user_1",
  username: "eu",
  name: "Eu",
  email: "eu@exemplo.test",
  avatar: null,
} as Profile;

const CHAVE = "connect-grow-active-identity";

function empresa(overrides: Partial<CorporateProfileView> = {}): CorporateProfileView {
  return {
    exists: true,
    username: "eu-profissional",
    name: "Eu Profissional",
    headline: "Designer",
    bio: "",
    avatar: "",
    banner: "",
    bannerHtml: "",
    location: "",
    industry: "",
    externalLinks: "",
    status: "ACTIVE",
    ...overrides,
  };
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

const botao = (nome: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === nome,
  );

describe("menu da conta: identidade social x profissional", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    window.localStorage.clear();
    mocks.me.mockReset();
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

  const abrirMenu = async () => {
    act(() => botao("Abrir menu")?.click());
    await flush();
    expect(host.querySelector("[data-open]")?.getAttribute("data-open")).toBe("true");
  };

  it("não oferece a troca enquanto o perfil profissional é rascunho", async () => {
    mocks.me.mockResolvedValue(empresa({ status: "DRAFT" }));
    await montar();
    await abrirMenu();

    expect(mocks.me).toHaveBeenCalled();
    expect(host.textContent).not.toContain("Identidade");
  });

  it("com preferência profissional salva, perfil em rascunho continua social", async () => {
    window.localStorage.setItem(CHAVE, "CORPORATE");
    mocks.me.mockResolvedValue(empresa({ status: "DRAFT" }));
    await montar();
    await abrirMenu();

    expect(host.querySelector("[data-identity]")?.getAttribute("data-identity")).toBe("SOCIAL");
    expect(host.textContent).not.toContain("Identidade");
  });

  it("com perfil ativo, mostra as duas identidades", async () => {
    mocks.me.mockResolvedValue(empresa());
    await montar();
    await abrirMenu();

    expect(host.textContent).toContain("Identidade");
    expect(botao("Social")).toBeDefined();
    expect(botao("Profissional")).toBeDefined();
  });

  it("troca para a identidade profissional, fecha o menu e confirma", async () => {
    mocks.me.mockResolvedValue(empresa());
    await montar();
    await abrirMenu();
    act(() => botao("Profissional")?.click());
    await flush();

    expect(window.localStorage.getItem(CHAVE)).toBe("CORPORATE");
    expect(host.querySelector("[data-identity]")?.getAttribute("data-identity")).toBe("CORPORATE");
    expect(host.querySelector("[data-open]")?.getAttribute("data-open")).toBe("false");
    expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining("profissional"), "success");
  });

  it("volta para a identidade social, fecha o menu e confirma", async () => {
    window.localStorage.setItem(CHAVE, "CORPORATE");
    mocks.me.mockResolvedValue(empresa());
    await montar();
    await abrirMenu();
    act(() => botao("Social")?.click());
    await flush();

    expect(window.localStorage.getItem(CHAVE)).toBe("SOCIAL");
    expect(host.querySelector("[data-identity]")?.getAttribute("data-identity")).toBe("SOCIAL");
    expect(host.querySelector("[data-open]")?.getAttribute("data-open")).toBe("false");
    expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining("social"), "success");
  });

  it("falha ao carregar o perfil não oferece a troca nem derruba o menu", async () => {
    mocks.me.mockRejectedValue(new Error("offline"));
    await montar();
    await abrirMenu();

    expect(host.textContent).not.toContain("Identidade");
    expect(host.querySelector("[data-identity]")?.getAttribute("data-identity")).toBe("SOCIAL");
  });
});
