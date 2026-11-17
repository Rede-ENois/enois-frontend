// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { JobApplication } from "@/types/application/job/job-application";
import type { RecruitmentApplication } from "@/types/application/job/recruitment-application";
import type { RecruitmentBoard } from "@/types/application/job/recruitment-board";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  receivedApplications: vi.fn(),
  updateApplicationStatus: vi.fn(),
  scheduleInterview: vi.fn(),
  rescheduleInterview: vi.fn(),
  cancelInterview: vi.fn(),
  board: vi.fn(),
  page: vi.fn(),
  move: vi.fn(),
  batchMove: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useParams: () => ({ jobId: "job_1" }),
  }),
}));
vi.mock("@/lib/api", () => ({
  jobsApi: {
    get: mocks.get,
    receivedApplications: mocks.receivedApplications,
    updateApplicationStatus: mocks.updateApplicationStatus,
    scheduleInterview: mocks.scheduleInterview,
    rescheduleInterview: mocks.rescheduleInterview,
    cancelInterview: mocks.cancelInterview,
  },
  recruitmentApi: {
    board: mocks.board,
    page: mocks.page,
    move: mocks.move,
    batchMove: mocks.batchMove,
  },
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./vagas.$jobId.candidaturas");
const JobApplications = (Route as unknown as { options: { component: () => React.JSX.Element } })
  .options.component;

const application = (overrides: Partial<JobApplication> = {}): JobApplication => ({
  id: "app_1",
  jobId: "job_1",
  status: "IN_REVIEW",
  appliedAt: "2026-11-01T12:00:00Z",
  answersCount: 0,
  candidate: {
    userId: "user_1",
    name: "Ana Souza",
    username: "ana",
    avatar: "",
    headline: "",
    identity: "CORPORATE",
    identityVerified: true,
    reputation: 10,
    experienceYears: 3,
    experiencesCount: 2,
    location: "",
    skills: [],
  },
  message: null,
  answers: [],
  interview: null,
  ...overrides,
});

const score = { total: 78, available: true, components: [] };

const card = (overrides: Partial<RecruitmentApplication> = {}): RecruitmentApplication => ({
  applicationId: "app_1",
  userId: "user_1",
  status: "IN_REVIEW",
  appliedAt: "2026-11-01T12:00:00Z",
  stageId: "stage_1",
  rejected: false,
  lastMovementAt: null,
  score,
  ...overrides,
});

const board = (overrides: Partial<RecruitmentBoard> = {}): RecruitmentBoard => ({
  stages: [{ id: "stage_1", name: "Triagem", position: 0 }],
  columns: [{ stageId: "stage_1", cards: [card()] }],
  rejected: [],
  summary: { total: 1, inProcess: 1, rejected: 0 },
  ...overrides,
});

describe("/vagas/$jobId/candidaturas painel de recrutamento", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <JobApplications />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  const button = (label: string) =>
    [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (element) => element.textContent?.trim() === label,
    );

  const checkbox = (label: string) =>
    [...host.querySelectorAll<HTMLInputElement>("input[type=checkbox]")].find(
      (element) => element.getAttribute("aria-label") === label,
    );

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue({ id: "job_1", title: "Pessoa Desenvolvedora" });
    mocks.board.mockResolvedValue(board());
    mocks.page.mockResolvedValue({ items: [card()], nextCursor: null });
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

  it("desenha o kanban com a candidatura na etapa", async () => {
    mocks.receivedApplications.mockResolvedValue([application()]);
    await render();

    expect(host.textContent).toContain("Triagem");
    expect(host.textContent).toContain("Ana Souza");
    expect(host.textContent).toContain("1 em processo");
  });

  it("abre a ficha da candidatura com as respostas do formulário", async () => {
    mocks.receivedApplications.mockResolvedValue([
      application({
        message: "Quero trabalhar com vocês",
        answers: [{ label: "Por que esta vaga?", value: "Pela missão" }],
      }),
    ]);
    await render();

    const open = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Abrir ficha de Ana Souza"]',
    );
    expect(open).toBeDefined();
    await act(async () => open!.click());
    await settle();

    // O diálogo vive num portal do Radix, fora do host do teste.
    const page = () => document.body.textContent ?? "";
    expect(page()).toContain("Quero trabalhar com vocês");
    expect(page()).toContain("Pela missão");
    // Em análise, as transições válidas são avançar e não selecionar — as mesmas do backend.
    expect(page()).toContain("Marcar como avançou");
    expect(page()).toContain("Não selecionar");
  });

  it("mover em lote exige a etapa escolhida: o botão só liga depois do select", async () => {
    mocks.receivedApplications.mockResolvedValue([application()]);
    await render();

    const box = checkbox("Selecionar candidatura de Ana Souza");
    expect(box).toBeDefined();
    await act(async () => box!.click());
    await settle();

    const advance = button("Avançar");
    expect(advance).toBeDefined();
    expect(advance!.disabled).toBe(true);

    const select = host.querySelector<HTMLSelectElement>('select[aria-label="Mover para"]');
    expect(select).toBeDefined();
    select!.value = "stage_1";
    select!.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();

    expect(button("Avançar")!.disabled).toBe(false);
    await act(async () => button("Avançar")!.click());
    await settle();

    expect(mocks.batchMove).toHaveBeenCalledWith("job_1", ["app_1"], "stage_1", "ADVANCE");
  });

  it("reprovar exige motivo: abre o diálogo e manda o texto escrito", async () => {
    mocks.receivedApplications.mockResolvedValue([application()]);
    mocks.updateApplicationStatus.mockResolvedValue(application({ status: "NOT_SELECTED" }));
    await render();

    const box = checkbox("Selecionar candidatura de Ana Souza");
    await act(async () => box!.click());
    await settle();

    const reject = button("Reprovar");
    expect(reject).toBeDefined();
    await act(async () => reject!.click());
    await settle();

    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    expect(textarea).toBeDefined();
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )!.set!;
    setter.call(textarea, "Perfil abaixo do que a vaga pede");
    textarea!.dispatchEvent(new Event("input", { bubbles: true }));

    const confirm = [...document.querySelectorAll<HTMLButtonElement>("button")].find((element) =>
      (element.textContent ?? "").includes("Enviar retorno"),
    );
    expect(confirm).toBeDefined();
    await act(async () => confirm!.click());
    await settle();

    expect(mocks.updateApplicationStatus).toHaveBeenCalledWith(
      "job_1",
      "app_1",
      "NOT_SELECTED",
      "Perfil abaixo do que a vaga pede",
    );
  });

  it("sem candidaturas mostra o estado vazio", async () => {
    mocks.board.mockResolvedValue(
      board({
        columns: [{ stageId: "stage_1", cards: [] }],
        summary: { total: 0, inProcess: 0, rejected: 0 },
      }),
    );
    mocks.receivedApplications.mockResolvedValue([]);
    await render();

    expect(host.textContent).toContain("Ninguém se candidatou ainda");
    expect(button("Avançar")).toBeUndefined();
  });
});
