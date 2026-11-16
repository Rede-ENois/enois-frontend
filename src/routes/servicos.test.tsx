// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O avatar do prestador no card de serviço chega da API como caminho relativo de mídia.
 * Sem passar pelo resolveCdnUrl, a src quebra em produção e a caixa de imagem quebrada
 * aparece quadrada no lugar do rosto (relato "Avatares quadrados no Marketplace").
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  catalog: vi.fn(),
  mine: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  messagesApi: { openDirect: vi.fn() },
  servicesApi: {
    catalog: mocks.catalog,
    mine: mocks.mine,
    buyListing: vi.fn(),
    openChat: vi.fn(),
    propose: vi.fn(),
    accept: vi.fn(),
    refund: vi.fn(),
    deliver: vi.fn(),
    publishListing: vi.fn(),
    createRequest: vi.fn(),
  },
}));
vi.mock("@/lib/use-auth", () => ({
  useIsAuthenticated: () => false,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
    useNavigate: () => () => undefined,
  }),
  useNavigate: () => () => undefined,
  Link: (props: Record<string, unknown>) => <a {...props} />,
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});

const oferta = {
  id: "lst_1",
  sellerId: "u_vendedor",
  sellerName: "Ana",
  sellerAvatar: "avatar/ana.webp",
  sellerStyle: null,
  category: "Design",
  title: "Logo para a banda",
  description: "Faço logo simples.",
  deliverables: "1 logo em PNG",
  price: 50_000,
  currency: "FAISCA",
  deliveryDays: 3,
  status: "ACTIVE",
  createdAt: "2026-11-15T10:00:00Z",
};

const { Route } = await import("./servicos");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const ServicosPage = (options as { component: () => React.JSX.Element }).component;

async function renderPage(): Promise<Root> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <ServicosPage />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return root;
}

describe("servicos: avatar do prestador", () => {
  let root: Root;

  beforeEach(() => {
    mocks.catalog.mockResolvedValue({ ofertas: [oferta], pedidos: [] });
    mocks.mine.mockResolvedValue({
      contratosComoComprador: [],
      contratosComoVendedor: [],
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("o card resolve a URL de mídia do avatar em vez de usar o caminho cru da API", async () => {
    root = await renderPage();

    const img = document.querySelector<HTMLImageElement>("li img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("https://ik.imagekit.io/socialcoisa/avatar/ana.webp");
  });
});
