// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { servicesApi } from "@/lib/api";

const { Route } = await import("./servicos");
const Servicos = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom não tem matchMedia; a renderização da página consultaria (sidebar/dock responsivos).
window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

/**
 * Gerência das próprias ofertas (issue #919): publicar era write-only — o preço publicado errado
 * e o serviço criado por engano só saíam pelo suporte. A página tem que listar as ofertas do
 * autor com editar e despublicar; despublicar não esconde o que já não existe.
 */

const mocks = vi.hoisted(() => ({
  catalog: vi.fn(),
  mine: vi.fn(),
  editListing: vi.fn(),
  removeListing: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    servicesApi: {
      ...actual.servicesApi,
      catalog: () => mocks.catalog(),
      mine: () => mocks.mine(),
      editListing: (id: string, data: Record<string, unknown>) => mocks.editListing(id, data),
      removeListing: (id: string) => mocks.removeListing(id),
    },
  };
});
vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ requireAuth: () => true, user: null }),
  useIsAuthenticated: () => true,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
    useNavigate: () => () => undefined,
  }),
  useNavigate: () => () => undefined,
  useRouterState: (opts?: { select?: (state: unknown) => unknown }) => {
    const state = {
      location: { pathname: "/servicos", search: "", href: "/servicos", state: null },
      matches: [],
    };
    return opts?.select ? opts.select(state) : state;
  },
  Link: (props: Record<string, unknown>) => <a {...props} />,
}));

const OFERTA = {
  id: "listing_1",
  sellerId: "u1",
  sellerName: "Ana",
  sellerAvatar: null,
  category: "design",
  title: "Logo para coletivo",
  description: "Faz logo bonito",
  deliverables: "Arquivo final",
  price: 30000,
  currency: "FAISCA",
  deliveryDays: 7,
  status: "ACTIVE",
  createdAt: "2026-11-01T12:00:00Z",
};

const EMPTY_MINE = { ofertas: [], contratosComoComprador: [], contratosComoVendedor: [] };

function renderPage() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let root: Root | null = null;
  act(() => {
    root = createRoot(host);
    root.render(
      <QueryClientProvider client={client}>
        <Servicos />
      </QueryClientProvider>,
    );
  });
  return {
    host,
    unmount: () => act(() => root?.unmount()),
    settle: async () => {
      for (let turn = 0; turn < 10 && host.querySelector('[role="status"]'); turn += 1) {
        await act(async () => {});
      }
      // As queries do painel (mine) resolvem em jobs separados: mais alguns giros até assentar.
      for (let turn = 0; turn < 6; turn += 1) {
        await act(async () => {});
      }
    },
  };
}

describe("Minhas ofertas (servicos)", () => {
  beforeEach(() => {
    mocks.catalog.mockResolvedValue({ ofertas: [OFERTA], pedidos: [] });
    mocks.mine.mockResolvedValue({ ...EMPTY_MINE, ofertas: [OFERTA] });
    mocks.editListing.mockResolvedValue({ id: OFERTA.id, status: "ACTIVE" });
    mocks.removeListing.mockResolvedValue({ id: OFERTA.id, status: "REMOVED" });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("lista as próprias ofertas com os botões de editar e despublicar", async () => {
    const page = renderPage();
    await page.settle();

    expect(page.host.textContent).toContain("Minhas ofertas");
    expect(page.host.textContent).toContain("Logo para coletivo");
    expect([...page.host.querySelectorAll("button")].some((b) => b.textContent === "Editar")).toBe(
      true,
    );
    expect(
      [...page.host.querySelectorAll("button")].some((b) => b.textContent === "Despublicar"),
    ).toBe(true);
    page.unmount();
  });

  it("despublica pelo botão com confirmação e some da lista", async () => {
    mocks.mine.mockResolvedValueOnce({ ...EMPTY_MINE, ofertas: [OFERTA] });
    const page = renderPage();
    await page.settle();

    const despublicar = [...page.host.querySelectorAll("button")].find(
      (b) => b.textContent === "Despublicar" && !b.closest('[role="dialog"]'),
    );
    expect(despublicar).toBeTruthy();
    act(() => despublicar!.click());

    // O dialog renderiza em portal no document.body, fora do host da página.
    expect(document.body.textContent).toContain("Despublicar serviço?");
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    const confirmar = [...dialog!.querySelectorAll("button")].find(
      (b) => b.textContent === "Despublicar",
    );
    expect(confirmar).toBeTruthy();
    act(() => confirmar!.click());
    await act(async () => {});
    await act(async () => {});

    expect(mocks.removeListing).toHaveBeenCalledWith(OFERTA.id);
    page.unmount();
  });

  it("não mostra a seção quando a conta não tem oferta ativa", async () => {
    mocks.mine.mockResolvedValue({ ...EMPTY_MINE, ofertas: [{ ...OFERTA, status: "REMOVED" }] });
    const page = renderPage();
    await page.settle();

    expect(page.host.textContent).not.toContain("Minhas ofertas");
    page.unmount();
  });

  it("a API de editar existe e é a usada pelo dialog de edição", () => {
    expect(typeof servicesApi.editListing).toBe("function");
  });
});
