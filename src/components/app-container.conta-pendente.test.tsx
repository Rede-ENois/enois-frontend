// @vitest-environment jsdom
import { act } from "react";

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coleção aberta, mural e compromisso da agenda (#994, #996, #997): o item aparece na lista, o
 * clique muda a rota e a tela de detalhe mostra o vazio. O vazio é o mesmo que aparece para um
 * item que não existe, e a tela desenhava ele enquanto o `/auth/me` da casca ainda estava na rede:
 * a casca abre a conta e o detalhe pede os mesmos dados na sequência.
 */
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/use-presence-heartbeat", () => ({ usePresenceHeartbeat: () => undefined }));
vi.mock("@/components/app-sidebar", () => ({ AppSidebar: () => null }));
vi.mock("@/components/authenticated-app-header", () => ({
  AuthenticatedAppHeader: () => null,
}));
vi.mock("@/components/mobile-dock", () => ({ MobileDock: () => null }));
vi.mock("@/components/navigation-drawer", () => ({ NavigationDrawer: () => null }));
vi.mock("@/components/notices/admin-notice", () => ({ AdminNoticeBanner: () => null }));

vi.mock("@rede-enois/design-system/patterns", () => {
  const slot =
    (name: string) =>
    ({ children }: { children?: React.ReactNode }) => <div data-slot={name}>{children}</div>;
  return {
    AppLayout: Object.assign(slot("root"), {
      Header: slot("header"),
      Content: slot("content"),
      Sidebar: slot("sidebar"),
      Main: slot("main"),
      Navigation: slot("navigation"),
    }),
  };
});

const conta = vi.hoisted(() => ({ estado: {} as Record<string, unknown> }));
const busca = vi.hoisted(() => ({ chamadas: 0 }));

vi.mock("@/lib/api", () => ({
  profileApi: { me: () => new Promise(() => undefined) },
  colecoesApi: {
    get: () => {
      busca.chamadas += 1;
      return new Promise(() => undefined);
    },
  },
}));

vi.mock("@/lib/current-user", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/current-user")>()),
  useCurrentUser: () => conta.estado,
}));

/** O detalhe como a rota escreve: busca na montagem e desenha o vazio no erro. */
function Detalhe() {
  const colecao = useQuery({
    queryKey: ["colecao", "colecao_1"],
    queryFn: () => colecoesApi.get("colecao_1"),
  });
  if (colecao.isError || !colecao.data) return <p>não encontrado</p>;
  return <section>detalhe do item</section>;
}

const { createAppQueryClient } = await import("@/lib/query-client");
const { colecoesApi } = await import("@/lib/api");
const { AppContainer } = await import("./app-container");

const PAGINA = (
  <AppContainer>
    <Detalhe />
  </AppContainer>
);

describe("casca do app enquanto a conta carrega", () => {
  let root: Root;
  let host: HTMLDivElement;
  let queryClient: QueryClient;

  beforeEach(() => {
    conta.estado = { isPending: true };
    busca.chamadas = 0;
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    queryClient = createAppQueryClient();
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("mostra a página enquanto a conta ainda não chegou", async () => {
    await act(async () => {
      root.render(<QueryClientProvider client={queryClient}>{PAGINA}</QueryClientProvider>);
    });

    // A página não desenha o vazio antes de a conta chegar. A busca não acontece: a página nem
    // está montada (o `Detalhe` busca no próprio render).
    expect(host.innerHTML).not.toContain("não encontrado");
    expect(host.textContent).not.toContain("detalhe do item");
  });

  it("mostra a página depois que a conta chega", async () => {
    conta.estado = { data: { id: "user_1" }, isPending: false };
    await act(async () => {
      root.render(<QueryClientProvider client={queryClient}>{PAGINA}</QueryClientProvider>);
    });

    expect(host.textContent).toContain("não encontrado");
  });

  it("manda a página para a tela", async () => {
    // Caminho que funcionava antes e continua funcionando: conta já em cache.
    conta.estado = { data: { id: "user_1" }, isPending: false };
    busca.chamadas = 0;
    await act(async () => {
      root.render(<QueryClientProvider client={queryClient}>{PAGINA}</QueryClientProvider>);
    });

    expect(busca.chamadas).toBe(1);
  });
});
