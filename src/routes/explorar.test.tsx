// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

/**
 * A rota do Explorar: o app traduz preferências, contagens e interface para o contrato do hub no
 * design system, e este teste prende exatamente essa tradução — os três estados de verdade
 * (carregando, erro com tentar de novo, pronto com as salas da interface ativa), o filtro de
 * módulos desligados pela pessoa e o sinal de novidade que acende no ladrilho. As frases do
 * desenho vêm do DS (`@rede-enois/design-system`, mensagens padrão `exploreHub`); as das salas,
 * de `texts.explore`.
 */

const mocks = vi.hoisted(() => ({
  personalization: vi.fn(),
  navigationCounts: vi.fn(),
  me: vi.fn(),
  portfolioByUsername: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
    useNavigate: () => () => undefined,
  }),
}));
vi.mock("@/lib/interface-context", () => ({
  // Interface SOCIAL fixa: o Explorar lista as salas da interface ativa, e o SOCIAL lista Desabafos.
  isOfInterface: (href: string) => !href.startsWith("/vagas") && !href.startsWith("/freelances"),
  useInterfaceContext: () => "SOCIAL",
}));
vi.mock("@/lib/navigation-signals", () => ({
  signalFor: vi.fn(() => null),
  useNavigationCounts: mocks.navigationCounts,
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/lib/use-personalization", () => ({
  usePersonalization: mocks.personalization,
}));
vi.mock("@/lib/api", () => ({
  profileApi: { me: mocks.me },
  portfolioApi: { byUsername: mocks.portfolioByUsername },
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./explorar");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const ExplorePage = (options as { component: () => React.JSX.Element }).component;

const pessoais = (extra: Record<string, unknown> = {}) => ({
  data: { disabledModules: [] as string[], ...extra },
  isPending: false,
  isError: false,
  refetch: vi.fn(async () => ({ data: undefined })),
  ...extra,
});

describe("rota do Explorar", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <ExplorePage />
        </QueryClientProvider>,
      );
    });
    await settle();
  };

  const botao = (texto: string) =>
    [...document.body.querySelectorAll("button")].find(
      (item) => item.textContent?.trim() === texto,
    );

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.personalization.mockReset();
    mocks.navigationCounts.mockReset();
    mocks.me.mockReset();
    mocks.portfolioByUsername.mockReset();
    mocks.me.mockResolvedValue({ id: "u1", username: "ana", name: "Ana Souza", avatar: null });
    mocks.portfolioByUsername.mockRejectedValue(
      new ApiError(404, "PORTFOLIO_NOT_FOUND", "não encontrado"),
    );
    mocks.personalization.mockReturnValue(pessoais());
    mocks.navigationCounts.mockReturnValue({
      summary: undefined,
      disabledModules: new Set<string>(),
      unreadMessages: 0,
      pendingRequests: 0,
    });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("pronto: as salas da interface ativa aparecem com busca e seções", async () => {
    await render();

    expect(document.body.textContent).toContain("Explorar");
    expect(document.body.textContent).toContain("Desabafos");
    expect(document.body.textContent).toContain("Um espaço acolhedor para desabafar");
    // A caixa de busca do hub existe: achar sala é por nome ou pelo que faz.
    expect(document.body.querySelector('input[type="search"]')).not.toBeNull();
    // Interface SOCIAL: sala do Trabalho fica de fora (o seletor de menu é o caminho).
    expect(document.body.textContent).not.toContain("Vagas");
  });

  it("módulo desligado pela pessoa não vira sala", async () => {
    mocks.personalization.mockReturnValue(
      pessoais({ data: { disabledModules: ["COMMUNITY_GAMES"] } }),
    );
    await render();

    expect(document.body.textContent).not.toContain("Jogos");
    expect(document.body.textContent).toContain("Desabafos");
  });

  it("carregando: o hub espera as preferências que decidem as salas", async () => {
    mocks.personalization.mockReturnValue(pessoais({ isPending: true, data: undefined }));
    await render();

    expect(document.body.textContent).toContain("Preparando o Explorar...");
    expect(document.body.textContent).not.toContain("Desabafos");
  });

  it("erro: o hub avisa e o tentar de novo refaz a busca", async () => {
    const refetch = vi.fn(async () => ({ data: undefined }));
    mocks.personalization.mockReturnValue(pessoais({ isError: true, refetch }));
    await render();

    expect(document.body.textContent).toContain("Não foi possível carregar o Explorar agora.");
    expect(document.body.textContent).not.toContain("Desabafos");

    const retry = botao("Tentar de novo");
    if (!retry) throw new Error("botão de tentar de novo não renderizado");
    await act(async () => retry.click());
    await settle();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("a vitrine de quem está lendo abre o Explorar, antes das salas", async () => {
    await render();

    const secao = document.body.querySelector("#explorar-vitrines");
    expect(secao?.textContent).toContain("Vitrines da comunidade");
    expect(secao?.textContent).toContain("Editar minha vitrine");
    expect(document.body.textContent).toContain("Desabafos");
  });

  it("vitrine no ar: a seção mostra o resumo publicado no lugar do convite", async () => {
    mocks.portfolioByUsername.mockResolvedValue({
      username: "ana",
      version: 1,
      html: "<p>Desenho e construo interfaces.</p>",
      publishedAt: "2026-11-20",
      blocks: [],
    });
    await render();

    const secao = document.body.querySelector("#explorar-vitrines");
    expect(secao?.textContent).toContain("Desenho e construo interfaces.");
    expect(secao?.querySelector('a[href="/portfolio/ana"]')).not.toBeNull();
    expect(secao?.textContent).not.toContain("Editar minha vitrine");
  });

  it("vitrine ilegível: o aviso com tentar de novo aparece e as salas seguem", async () => {
    mocks.portfolioByUsername.mockRejectedValue(new ApiError(503, undefined, "indisponível"));
    await render();

    expect(document.body.textContent).toContain(texts.portfolio.loadError);
    expect(document.body.textContent).toContain("Desabafos");

    const retry = botao(texts.portfolio.retry);
    if (!retry) throw new Error("botão de tentar de novo da vitrine não renderizado");
    await act(async () => retry.click());
    await settle();

    expect(mocks.portfolioByUsername).toHaveBeenCalledTimes(2);
  });
});
