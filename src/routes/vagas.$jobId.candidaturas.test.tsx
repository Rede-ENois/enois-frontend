// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { JobApplication } from "@/types/application/job/job-application";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  receivedApplications: vi.fn(),
  updateApplicationStatus: vi.fn(),
  scheduleInterview: vi.fn(),
  rescheduleInterview: vi.fn(),
  cancelInterview: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useParams: () => ({ jobId: "job_1" }),
  }),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  useNavigate: () => () => undefined,
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

describe("/vagas/$jobId/candidaturas entrevista", () => {
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

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue({ id: "job_1", title: "Pessoa Desenvolvedora" });
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

  it("oferece marcar entrevista quando ainda não há uma", async () => {
    mocks.receivedApplications.mockResolvedValue([application()]);
    await render();

    expect(button("Marcar entrevista")).toBeDefined();
    expect(button("Reagendar")).toBeUndefined();
  });

  it("mostra a entrevista marcada e oferece reagendar e cancelar", async () => {
    mocks.receivedApplications.mockResolvedValue([
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

    // 17:00 UTC é 14:00 em São Paulo: a linha mostra a hora da agenda.
    expect(host.textContent).toContain("14:00");
    expect(button("Reagendar")).toBeDefined();
    expect(button("Cancelar entrevista")).toBeDefined();
    expect(button("Marcar entrevista")).toBeUndefined();
  });

  it("não oferece entrevista para candidatura não selecionada", async () => {
    mocks.receivedApplications.mockResolvedValue([application({ status: "NOT_SELECTED" })]);
    await render();

    expect(button("Marcar entrevista")).toBeUndefined();
  });
});
