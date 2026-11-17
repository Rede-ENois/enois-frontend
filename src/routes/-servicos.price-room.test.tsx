// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const offer = {
  id: "sl_1",
  sellerId: "u_1",
  sellerName: null,
  sellerAvatar: null,
  category: "Programação",
  title: "Site completo com loja virtual",
  description: "Loja, agenda e painel.",
  deliverables: "Site no ar",
  price: 1_234_567_890,
  currency: "FAISCA",
  deliveryDays: 7,
  status: "ACTIVE",
  createdAt: "2026-11-13T00:00:00Z",
};

const request = {
  id: "sr_1",
  requesterId: "u_2",
  category: "Design",
  title: "Identidade visual completa para cooperativa",
  description: "Logo e papelaria.",
  deliverables: "Arquivos finais",
  budgetMin: 1_234_567_000,
  budgetMax: 9_876_543_210,
  status: "OPEN",
  createdAt: "2026-11-13T00:00:00Z",
};

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  messagesApi: { openDirect: vi.fn() },
  servicesApi: {
    catalog: vi.fn(async () => ({ ofertas: [offer], pedidos: [request] })),
    mine: vi.fn(async () => ({
      ofertas: [offer],
      contratosComoComprador: [],
      contratosComoVendedor: [],
    })),
  },
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

const routeComponent = (route: unknown) =>
  (route as { options: { component: () => React.JSX.Element } }).options.component;
const Servicos = routeComponent((await import("./servicos")).Route);
const MeusServicos = routeComponent((await import("./meus-servicos")).Route);

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const waitForQueriesToResolve = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const render = async (Page: () => React.JSX.Element) => {
  await act(async () => {
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <Page />
      </QueryClientProvider>,
    );
  });
  await waitForQueriesToResolve();
};

const click = async (label: string) => {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === label,
  );
  expect(button).toBeDefined();
  await act(async () => button!.click());
};

const innermostSpanWithText = (text: string) => {
  const matches = Array.from(container.querySelectorAll("span")).filter(
    (element) => element.textContent === text,
  );
  expect(matches).not.toHaveLength(0);
  return matches.at(-1)!;
};

const expectBoundedValue = (element: HTMLElement, text: string) => {
  expect(element.classList).toContain("max-w-[45%]");
  expect(element.classList).toContain("truncate");
  expect(element.classList).toContain("shrink-0");
  expect(element.getAttribute("title")).toBe(text);
};

describe("preço e orçamento longos não escondem o título do card de serviço (#806)", () => {
  it("na oferta, o preço ocupa até 45% da linha, termina em … e mostra o valor inteiro no title", async () => {
    await render(Servicos);

    const pill = innermostSpanWithText("1.234.567 faíscas 890 fagulhas");

    expectBoundedValue(pill, "1.234.567 faíscas 890 fagulhas");
  });

  it("na oferta cortada, o ícone continua junto do preço", async () => {
    await render(Servicos);

    const pill = innermostSpanWithText("1.234.567 faíscas 890 fagulhas");

    expect(pill.classList).not.toContain("flex");
    expect(pill.querySelector("svg")?.classList).toContain("inline");
  });

  it("no pedido aberto, o orçamento ocupa até 45% da linha, termina em … e mostra o valor inteiro no title", async () => {
    await render(Servicos);

    await click("Pedidos abertos");

    const budget = innermostSpanWithText("1.234.567 faíscas a 9.876.543 faíscas 210 fagulhas");
    expectBoundedValue(budget, "1.234.567 faíscas a 9.876.543 faíscas 210 fagulhas");
  });

  it("em Gerenciar serviços, o preço ocupa até 45% da linha, termina em … e mostra o valor inteiro no title", async () => {
    await render(MeusServicos);

    const price = innermostSpanWithText("1.234.567 faíscas 890 fagulhas");

    expectBoundedValue(price, "1.234.567 faíscas 890 fagulhas");
  });
});
