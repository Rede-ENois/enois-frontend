// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { MyApplication } from "@/types/application/job/my-application";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mine: vi.fn(),
  myExternal: vi.fn(),
  myApplications: vi.fn(),
  remove: vi.fn(),
  removeExternal: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  jobsApi: {
    mine: mocks.mine,
    myExternal: mocks.myExternal,
    myApplications: mocks.myApplications,
    remove: mocks.remove,
    removeExternal: mocks.removeExternal,
  },
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/job-edit-dialog", () => ({ JobEditDialog: () => null }));

const { Route } = await import("./vagas.minhas");
const MyJobs = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

const application = (overrides: Partial<MyApplication> = {}): MyApplication => ({
  id: "app_1",
  jobId: "job_1",
  jobTitle: "Pessoa Desenvolvedora",
  jobCompany: "Énóis",
  status: "IN_REVIEW",
  feedback: null,
  reviewedAt: null,
  appliedAt: "2026-11-01T12:00:00Z",
  interview: null,
  ...overrides,
});

describe("/vagas/minhas entrevista do candidato", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <MyJobs />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.mine.mockResolvedValue({ items: [], nextCursor: null });
    mocks.myExternal.mockResolvedValue([]);
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

  it("mostra o horário da entrevista no fuso em que foi marcada", async () => {
    mocks.myApplications.mockResolvedValue([
      application({
        interview: {
          id: "int_1",
          applicationId: "app_1",
          jobId: "job_1",
          candidateId: "cand_1",
          status: "SCHEDULED",
          startsAt: "2027-03-10T17:00:00Z",
          endsAt: "2027-03-10T18:00:00Z",
          timeZoneId: "America/Sao_Paulo",
          notes: null,
          createdAt: "2026-11-01T12:00:00Z",
          updatedAt: "2026-11-01T12:00:00Z",
          cancelledAt: null,
        },
      }),
    ]);
    await render();

    // 17:00 UTC é 14:00 em São Paulo: a lista do candidato mostra a hora da agenda.
    expect(host.textContent).toContain("Entrevista marcada");
    expect(host.textContent).toContain("14:00");
  });

  it("não mostra entrevista quando não há uma valendo", async () => {
    mocks.myApplications.mockResolvedValue([application()]);
    await render();

    expect(host.textContent).not.toContain("Entrevista marcada");
  });

  it("não mostra entrevista cancelada", async () => {
    mocks.myApplications.mockResolvedValue([
      application({
        interview: {
          id: "int_1",
          applicationId: "app_1",
          jobId: "job_1",
          candidateId: "cand_1",
          status: "CANCELLED",
          startsAt: "2027-03-10T17:00:00Z",
          endsAt: "2027-03-10T18:00:00Z",
          timeZoneId: "America/Sao_Paulo",
          notes: null,
          createdAt: "2026-11-01T12:00:00Z",
          updatedAt: "2026-11-01T12:00:00Z",
          cancelledAt: "2026-11-02T12:00:00Z",
        },
      }),
    ]);
    await render();

    expect(host.textContent).not.toContain("Entrevista marcada");
  });
});
