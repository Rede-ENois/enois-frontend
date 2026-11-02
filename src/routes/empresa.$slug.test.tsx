// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CompanyDetail } from "@/types/application/companies/company-detail";
import type { ReportDialogProps } from "@/types/components/post/report-dialog-props";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bySlug: vi.fn(),
  report: null as ReportDialogProps | null,
}));

// A página em si é do design system: aqui interessa o botão de denunciar que a rota põe por cima.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useParams: () => ({ slug: "empresa-testada" }),
  }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/api", () => ({
  companiesApi: {
    bySlug: mocks.bySlug,
    publishProject: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(),
    project: vi.fn(),
    propose: vi.fn(),
    selectProposal: vi.fn(),
    complete: vi.fn(),
  },
}));
vi.mock("@/lib/query-options/companies", () => ({
  companyQueries: {
    detail: (slug: string) => ({ queryKey: ["empresa", slug], queryFn: () => mocks.bySlug(slug) }),
  },
}));
vi.mock("@/lib/use-professional-identity", () => ({
  useProfessionalIdentity: () => ({ applicant: null, professionalSetupHref: null }),
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/company-edit-dialog", () => ({ CompanyEditDialog: () => null }));
vi.mock("@/components/micro-project-management", () => ({
  MicroProjectManagement: () => <div data-testid="management" />,
}));
vi.mock("@/components/post/report-dialog", () => ({
  ReportDialog: (props: ReportDialogProps) => {
    mocks.report = props;
    return null;
  },
}));
vi.mock("@rede-enois/design-system/domain", () => ({
  CompanyPageView: () => null,
  CompleteMicroProjectDialog: () => null,
  MicroProjectProposalDialog: () => null,
  MicroProjectProposalsDialog: () => null,
  NewMicroProjectDialog: () => null,
}));

const { Route } = await import("./empresa.$slug");
const Empresa = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

const company = (overrides: Partial<CompanyDetail>): CompanyDetail => ({
  id: "cmp_1",
  slug: "empresa-testada",
  name: "Empresa Testada",
  description: "Uma empresa qualquer do diretório.",
  sector: "Tecnologia",
  size: "11-50",
  location: "Remoto",
  website: null,
  logo: null,
  cover: null,
  myRole: null,
  projects: [],
  jobs: [],
  stats: { openProjects: 0, completedProjects: 0, openJobs: 0, followers: 3 },
  following: false,
  reviews: [],
  canPropose: "OK",
  ...overrides,
});

describe("/empresa/$slug", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async (detail: CompanyDetail) => {
    mocks.bySlug.mockResolvedValue(detail);
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Empresa />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  const reportButton = () =>
    [...host.querySelectorAll("button")].find((b) => b.textContent === "Denunciar página");

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.bySlug.mockReset();
    mocks.report = null;
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

  it("offers the report to a signed-in visitor, targeting the company id", async () => {
    await render(company({}));

    await act(async () => reportButton()!.click());
    await settle();

    expect(mocks.report).toMatchObject({
      targetId: "cmp_1",
      targetType: "COMPANY",
      open: true,
    });
  });

  it("does not offer the report to the team itself", async () => {
    await render(company({ myRole: "EDITOR" }));

    expect(reportButton()).toBeUndefined();
    // O diálogo existe (montado fechado), mas ninguém o abre.
    expect(mocks.report?.open).toBe(false);
  });

  it("offers project management only to editors and administrators", async () => {
    await render(company({ myRole: "EDITOR" }));
    expect(host.querySelector('[data-testid="management"]')).not.toBeNull();
    await render(company({ myRole: "RECRUITER" }));
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["empresa", "empresa-testada"] });
    });
    await settle();
    expect(host.querySelector('[data-testid="management"]')).toBeNull();
  });

  it("does not offer the report to someone without a session", async () => {
    // Sem sessão, denúncia não existe: o próprio backend exige. O botão levaria a um erro.
    await render(company({ canPropose: "SIGN_IN" }));

    expect(reportButton()).toBeUndefined();
  });
});
