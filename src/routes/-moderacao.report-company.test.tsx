// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  review: vi.fn(),
  removeCompany: vi.fn(),
  ban: vi.fn(),
  penalize: vi.fn(),
  warn: vi.fn(),
  deletePost: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  useParams: () => ({ reportId: "report_1" }),
  useSearch: () => ({}),
}));
vi.mock("@/lib/api/reports-admin", () => ({
  reportsAdminApi: {
    review: mocks.review,
    removeCompany: mocks.removeCompany,
    ban: mocks.ban,
    penalize: mocks.penalize,
    warn: mocks.warn,
    deletePost: mocks.deletePost,
  },
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./moderacao.$reportId");
const Revisao = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

const review = (targetType: string) => ({
  report: {
    id: "report_1",
    reason: "SPAM",
    targetType,
    targetId: "cmp_1",
    status: "PENDING",
    description: null,
  },
  reporter: "Quem denunciou",
  authorId: "owner_1",
  author: "Dono da página",
  content: "Texto da página",
});

describe("/moderacao/$reportId", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));
  const button = (label: string) =>
    [...host.querySelectorAll("button")].find((b) => b.textContent === label);

  const render = async (targetType: string) => {
    mocks.review.mockResolvedValue(review(targetType));
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Revisao />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it("offers only the company action on a company report", async () => {
    await render("COMPANY");

    expect(button("Remover a página empresarial")).toBeDefined();
    expect(button("Avisar o autor")).toBeDefined();
    // Banir ou penalizar o dono por causa da página não existe: o servidor recusa.
    expect(button("Banir o autor")).toBeUndefined();
    expect(button("Penalizar o autor")).toBeUndefined();
    expect(button("Excluir o post")).toBeUndefined();
  });

  it("removes the page through the company endpoint", async () => {
    mocks.removeCompany.mockResolvedValue("{}");
    await render("COMPANY");

    await act(async () => button("Remover a página empresarial")!.click());
    await settle();

    expect(mocks.removeCompany).toHaveBeenCalledWith("report_1");
  });

  it("keeps the post actions on a post report", async () => {
    await render("POST");

    expect(button("Banir o autor")).toBeDefined();
    expect(button("Excluir o post")).toBeDefined();
    expect(button("Remover a página empresarial")).toBeUndefined();
  });
});
