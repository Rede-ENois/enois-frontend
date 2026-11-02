// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CorporateProfileView } from "@/types/application/corporate/corporate-profile-view";
import type { ContextSwitcherProps as ViewProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContextSwitcher } from "./context-switcher";

const mocks = vi.hoisted(() => ({ me: vi.fn(), navigate: vi.fn(), pathname: "/feed" }));

vi.mock("@/lib/api", () => ({ corporateApi: { me: mocks.me } }));
vi.mock("@/lib/session", () => ({ hasSessionFlag: () => true }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { pathname: mocks.pathname } }),
}));
// Probe of the DS view: the container's contract is what it feeds in.
vi.mock("@rede-enois/design-system/domain", () => ({
  ContextSwitcher: ({ value, onChange, professionalSetupHref }: ViewProps) => (
    <div data-value={value}>
      <button type="button" onClick={() => onChange("SOCIAL")}>
        Social
      </button>

      <button type="button" onClick={() => onChange("PROFESSIONAL")}>
        Profissional
      </button>

      {professionalSetupHref && <a href={professionalSetupHref}>Ative</a>}
    </div>
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const KEY = "connect-grow-active-identity";

function profile(status: CorporateProfileView["status"]): CorporateProfileView {
  return {
    exists: true,
    username: "mel.pro",
    name: "Mel",
    headline: "Dev",
    bio: "",
    avatar: "",
    banner: "",
    bannerHtml: "",
    location: "",
    industry: "",
    externalLinks: "",
    status,
  };
}

const flush = () =>
  act(async () => {
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

const button = (name: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === name,
  );

describe("seletor Social / Profissional", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    window.localStorage.clear();
    mocks.me.mockReset();
    mocks.navigate.mockReset();
    mocks.pathname = "/feed";
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const mount = async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <ContextSwitcher />
        </QueryClientProvider>,
      ),
    );
    await flush();
  };

  const value = () => host.querySelector("[data-value]")?.getAttribute("data-value");

  it("em página compartilhada troca a interface sem sair da página e lembra a escolha", async () => {
    mocks.pathname = "/mensagens";
    mocks.me.mockResolvedValue(profile("ACTIVE"));
    await mount();
    expect(value()).toBe("SOCIAL");

    act(() => button("Profissional")?.click());
    await flush();

    expect(value()).toBe("PROFESSIONAL");
    expect(window.localStorage.getItem(KEY)).toBe("PROFESSIONAL");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("em página exclusiva da outra interface vai para o início da escolhida", async () => {
    mocks.pathname = "/comunidades";
    mocks.me.mockResolvedValue(profile("ACTIVE"));
    await mount();
    expect(value()).toBe("SOCIAL");

    act(() => button("Profissional")?.click());
    await flush();

    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/feed" });
  });

  it("link direto para uma vaga abre na interface profissional, mesmo com a escolha social", async () => {
    window.localStorage.setItem(KEY, "SOCIAL");
    mocks.pathname = "/vagas/job_1";
    mocks.me.mockResolvedValue(profile("ACTIVE"));
    await mount();

    expect(value()).toBe("PROFESSIONAL");
    expect(window.localStorage.getItem(KEY)).toBe("PROFESSIONAL");
  });

  it("oferece ativar o perfil profissional enquanto ele não está ativo", async () => {
    mocks.me.mockResolvedValue(profile("DRAFT"));
    await mount();
    expect(host.querySelector('a[href="/profissional"]')).not.toBeNull();
  });

  it("sem perfil profissional também oferece criar, sem quebrar", async () => {
    mocks.me.mockResolvedValue({ exists: false });
    await mount();
    expect(host.querySelector('a[href="/profissional"]')).not.toBeNull();
  });

  it("com perfil ativo não oferece nada, e erro de rede não mostra o convite", async () => {
    mocks.me.mockResolvedValue(profile("ACTIVE"));
    await mount();
    expect(host.querySelector('a[href="/profissional"]')).toBeNull();

    act(() => root.unmount());
    root = createRoot(host);
    mocks.me.mockRejectedValue(new Error("offline"));
    await mount();
    expect(host.querySelector('a[href="/profissional"]')).toBeNull();
  });
});
