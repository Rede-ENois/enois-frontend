// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Job } from "@/types/application/job/job";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useParams: () => ({ jobId: "ext_1" }),
  }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  Outlet: () => null,
  useMatchRoute: () => () => false,
  useNavigate: () => vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  jobsApi: {
    get: mocks.get,
    apply: vi.fn(),
    save: vi.fn(),
    removeSave: vi.fn(),
    remove: vi.fn(),
    close: vi.fn(),
    applications: vi.fn(),
    changeApplicationStatus: vi.fn(),
  },
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: null }) }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/apply-by-email-button", () => ({ ApplyByEmailButton: () => null }));
vi.mock("@/components/apply-job-dialog", () => ({ ApplyJobDialog: () => null }));
vi.mock("@/components/job-edit-dialog", () => ({ JobEditDialog: () => null }));

const { Route } = await import("./vagas.$jobId");
const JobDetail = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

const externalJob = (overrides: Partial<Job> = {}): Job =>
  ({
    id: "ext_1",
    title: "Backend Engineer",
    company: "Acme",
    location: "Remoto",
    skills: [],
    sourceType: "EXTERNAL",
    sourcePlatform: "Jobicy",
    sourceUrl: "https://jobicy.com/jobs/1",
    status: "OPEN",
    description: null,
    ...overrides,
  }) as Job;

describe("/vagas/$jobId — descrição", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async (job: Job) => {
    mocks.get.mockResolvedValue(job);
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <JobDetail />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.get.mockReset();
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

  it("não mostra o texto da lista no lugar da descrição da vaga externa", async () => {
    await render(externalJob());

    // "Vagas filtradas por nível, localização, tipo e habilidades" é a chamada da LISTA: não diz
    // nada sobre esta vaga e aparecia como se fosse o corpo do anúncio.
    expect(host.textContent).not.toContain("Vagas filtradas por nível");
    expect(host.textContent).toContain("A fonte não publica a descrição desta vaga");
  });

  it("mostra a descrição quando a fonte publica", async () => {
    await render(externalJob({ description: "Vaga para time de plataforma." }));

    expect(host.textContent).toContain("Vaga para time de plataforma.");
    expect(host.textContent).not.toContain("A fonte não publica a descrição");
  });

  it("vaga da casa sem descrição não culpa a fonte externa", async () => {
    await render(externalJob({ sourceType: "INTERNAL", sourcePlatform: null, sourceUrl: null }));

    expect(host.textContent).toContain("Quem publicou esta vaga não escreveu uma descrição");
    expect(host.textContent).not.toContain("A fonte não publica a descrição");
  });
});
