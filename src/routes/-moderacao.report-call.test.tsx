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

const review = (overrides: Record<string, unknown> = {}) => ({
  report: {
    id: "report_1",
    reason: "ABUSE",
    targetType: "CALL",
    targetId: "call_1",
    status: "PENDING",
    description: null,
  },
  reporter: "Quem denunciou",
  authorId: "author_1",
  author: "Quem foi denunciado",
  content: "Relato da denúncia",
  call: {
    callId: "call_1",
    reportedUserId: "author_1",
    participants: ["Quem denunciou", "Quem foi denunciado"],
    mediaId: null,
    reportedAt: "2026-11-03T12:00:00Z",
  },
  media: null,
  ...overrides,
});

describe("/moderacao/$reportId — denúncia de chamada", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async (payload: Record<string, unknown>) => {
    mocks.review.mockResolvedValue(payload);
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

  it("mostra quando a denúncia foi feita, junto da captura", async () => {
    await render(review());

    // A hora vem do servidor (reportedAt) e é formatada pelo utilitário único da app.
    expect(host.textContent).toContain("Denúncia feita em");
    expect(host.textContent).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("não inventa horário quando o servidor não manda reportedAt", async () => {
    await render(review({ call: null }));

    expect(host.textContent).not.toContain("Denúncia feita em");
  });
});
