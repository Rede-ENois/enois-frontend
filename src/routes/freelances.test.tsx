// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { FreelanceView } from "@/types/application/freelance/freelance-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  close: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  freelancesApi: {
    list: mocks.list,
    create: mocks.create,
    update: mocks.update,
    remove: mocks.remove,
    close: mocks.close,
    apply: vi.fn(),
  },
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/apply-freelance-dialog", () => ({
  ApplyFreelanceDialog: () => null,
}));

const { Route } = await import("./freelances");
const Freelances = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

const freelance = (overrides: Partial<FreelanceView>): FreelanceView => ({
  id: "fr-1",
  userId: "me",
  username: "eu",
  title: "Landing page em três semanas",
  scope: "Preciso de uma landing page para o lançamento do produto, com seções de preço e FAQ.",
  budgetMin: 1_500,
  budgetMax: 2_000,
  deadline: "2026-12-01",
  paymentMethod: "CASH",
  status: "OPEN",
  createdAt: "2026-10-30T12:00:00Z",
  owned: true,
  ...overrides,
});

describe("/freelances", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const button = (label: string, scope: ParentNode = host) =>
    [...scope.querySelectorAll("button")].find((item) => item.textContent === label);

  const fill = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element) as object, "value")!.set!.call(
      element,
      value,
    );
    element.dispatchEvent(new Event("input", { bubbles: true }));
  };

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  const render = async (items: FreelanceView[] = [freelance({})]) => {
    mocks.list.mockResolvedValue({ items, nextCursor: null });
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Freelances />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  it("shows edit and delete only on what the viewer published", async () => {
    await render([freelance({}), freelance({ id: "fr-2", owned: false, username: "outra" })]);

    expect(button("Editar freela")).toBeDefined();
    expect(button("Editar freela", host.querySelectorAll("li")[1] as ParentNode)).toBeUndefined();
  });

  it("edits cash budgets in reais, not in thousandths of a spark", async () => {
    await render();
    mocks.update.mockResolvedValue(freelance({ title: "Landing page revisada" }));

    await act(async () => button("Editar freela")!.click());

    const dialog = document.querySelector('[role="dialog"]')!;
    const inputs = [...dialog.querySelectorAll("input")];
    // O valor gravado em dinheiro é R$ inteiro: o formulário abre com "1500", não "1500000".
    expect(inputs.map((input) => input.value)).toContain("1500");

    await act(async () => fill(inputs[0] as HTMLInputElement, "Landing page revisada"));
    await act(async () => fill(inputs[1] as HTMLInputElement, "1800"));
    await act(async () => button("Salvar alterações", dialog)!.click());
    await settle();

    expect(mocks.update).toHaveBeenCalledTimes(1);
    const [id, body] = mocks.update.mock.calls[0];
    expect(id).toBe("fr-1");
    expect(body).toMatchObject({
      title: "Landing page revisada",
      paymentMethod: "CASH",
      budgetMin: 1800,
      budgetMax: 2000,
    });
  });

  it("deletes the freelance after confirmation", async () => {
    await render();
    mocks.remove.mockResolvedValue({ id: "fr-1", status: "DELETED" });

    await act(async () => button("Excluir")!.click());

    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain("Excluir este freela?");
    const confirm = [...dialog.querySelectorAll("button")].find((b) => b.textContent === "Excluir");
    await act(async () => confirm!.click());
    await settle();

    expect(mocks.remove).toHaveBeenCalledWith("fr-1");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
