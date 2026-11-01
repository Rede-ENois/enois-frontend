// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CompanyDetail } from "@/types/application/companies/company-detail";
import type { MicroProjectView } from "@/types/application/companies/micro-project-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ edit: vi.fn(), remove: vi.fn(), toast: vi.fn() }));
vi.mock("@/lib/api", () => ({
  companiesApi: { editProject: mocks.edit, removeProject: mocks.remove },
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  Button: (props: React.ComponentProps<"button">) => <button {...props} />,
  Input: (props: React.ComponentProps<"input">) => <input {...props} />,
  Textarea: (props: React.ComponentProps<"textarea">) => <textarea {...props} />,
  Label: (props: React.ComponentProps<"label">) => <label {...props} />,
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  useToast: () => ({ toast: mocks.toast }),
}));

const { MicroProjectManagement } = await import("./micro-project-management");
const project = (overrides: Partial<MicroProjectView> = {}): MicroProjectView => ({
  id: "project-1",
  companyId: "company-1",
  title: "Projeto original",
  problem: "Um problema com mais de trinta caracteres para o teste.",
  scope: "Escopo original",
  deliverables: "Primeira entrega\nSegunda entrega",
  acceptanceCriteria: "Criterio original",
  budget: "100",
  deadline: "2027-12-31",
  status: "OPEN",
  createdAt: "2026-10-01",
  myProposal: null,
  proposalCount: 0,
  ...overrides,
});
const company = (projects: MicroProjectView[]) => ({ slug: "teste", projects }) as CompanyDetail;

describe("gerenciar microprojetos", () => {
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;
  const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  const button = (text: string) =>
    [...host.querySelectorAll("button")].find((item) => item.textContent === text)!;
  const render = async (projects: MicroProjectView[]) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <MicroProjectManagement company={company(projects)} />
        </QueryClientProvider>,
      ),
    );
  };
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.clearAllMocks();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it("edita os campos existentes e atualiza as consultas", async () => {
    mocks.edit.mockResolvedValue({ id: "project-1", status: "OPEN" });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await render([project()]);
    await act(async () => button("Editar").click());
    expect((host.querySelector("#mp-scope") as HTMLTextAreaElement).value).toBe("Escopo original");
    expect((host.querySelector("#mp-deadline") as HTMLInputElement).value).toBe("2027-12-31");
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    await settle();
    expect(mocks.edit).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({
        title: "Projeto original",
        deliverables: "Primeira entrega\nSegunda entrega",
        deadline: "2027-12-31",
      }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["empresa", "teste"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["companies"] });
    expect(host.querySelector("form")).toBeNull();
  });

  it("pede confirmação antes de remover e oculta ações para projetos com candidaturas ou encerrados", async () => {
    mocks.remove.mockResolvedValue({ id: "project-1", status: "CANCELLED" });
    await render([
      project(),
      project({ id: "project-2", title: "Com candidato", proposalCount: 1 }),
      project({ id: "project-3", title: "Concluído", status: "COMPLETED" }),
    ]);
    expect(host.querySelectorAll("li")).toHaveLength(1);
    await act(async () => button("Remover").click());
    expect(mocks.remove).not.toHaveBeenCalled();
    const buttons = [...host.querySelectorAll("button")].filter(
      (item) => item.textContent === "Remover",
    );
    await act(async () => buttons[1].click());
    await settle();
    expect(mocks.remove).toHaveBeenCalledWith("project-1");
  });

  it("mostra erro quando a edição falha e mantém o formulário aberto", async () => {
    mocks.edit.mockRejectedValue(new Error("failure"));
    await render([project()]);
    await act(async () => button("Editar").click());
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    await settle();
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(host.querySelector("form")).not.toBeNull();
  });
});
