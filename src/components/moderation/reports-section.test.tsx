// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { ModeratorPanelReportView } from "@/types/application/moderation/moderator-panel-report-view";
import type { ReportView } from "@/types/application/report/report-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

const mocks = vi.hoisted(() => ({
  reports: vi.fn(),
  vote: vi.fn(),
  penalize: vi.fn(),
  warn: vi.fn(),
  deletePost: vi.fn(),
  removeCompany: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ moderationApi: mocks }));
vi.mock("@/lib/api/reports-admin", () => ({ reportsAdminApi: mocks }));
const { ReportsSection } = await import("./reports-section");

const report: ModeratorPanelReportView = {
  reportId: "denuncia_ficticia",
  targetType: "POST",
  targetId: "publicacao_ficticia",
  reason: "VIOLENCE",
  description: "Relato fictício para revisão humana.",
  createdAt: "2026-11-14T12:00:00Z",
  reporter: "denunciante_ficticio",
  authorId: "autor_ficticio",
  author: "Autor fictício",
  content: "Conteúdo sintético denunciado.",
  punishVotes: 1,
  dismissVotes: 0,
  myVote: null,
  quorum: 6,
};
const decision: ReportView = {
  id: report.reportId,
  targetType: report.targetType,
  targetId: report.targetId,
  reason: report.reason,
  description: report.description ?? "",
  status: "AUTO_PENALIZED",
  createdAt: report.createdAt,
};
let host: HTMLDivElement;
let root: Root;
let client: QueryClient;

function button(label: string, scope: ParentNode = document): HTMLButtonElement {
  const found = [...scope.querySelectorAll("button")].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!found) throw new Error(`Botão não encontrado: ${label}`);
  return found;
}
async function render(admin = true) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ReportsSection admin={admin} />
      </QueryClientProvider>,
    ),
  );
}
async function waitText(text: string) {
  await vi.waitFor(async () => {
    await act(async () => Promise.resolve());
    expect(document.body.textContent).toContain(text);
  });
}
async function click(label: string, scope: ParentNode = document) {
  await act(async () => button(label, scope).click());
}
function dialog(): HTMLElement {
  const found = document.querySelector<HTMLElement>('[role="dialog"]');
  if (!found) throw new Error("Confirmação não disponível");
  return found;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.reports.mockResolvedValue([report]);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  host.remove();
  vi.unstubAllGlobals();
});

describe("fila de denúncias: integração do painel", () => {
  it("não apresenta fila vazia enquanto a primeira consulta está pendente", async () => {
    let complete: (value: ModeratorPanelReportView[]) => void = () => {
      throw new Error("Consulta não iniciada");
    };
    mocks.reports.mockImplementation(
      () =>
        new Promise<ModeratorPanelReportView[]>((resolve) => {
          complete = resolve;
        }),
    );
    await render();
    expect(host.textContent).not.toContain("Nenhuma denúncia");
    expect(host.textContent).not.toContain(report.content);
    await act(async () => complete([report]));
    await waitText(report.content ?? "");
  });

  it("apresenta erro explícito e recupera a consulta sem simular uma fila vazia", async () => {
    mocks.reports.mockRejectedValueOnce(new Error("Falha sintética")).mockResolvedValue([report]);
    await render();
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')).not.toBeNull());
    expect(host.textContent).not.toContain("Nenhuma denúncia");
    await click("Tentar novamente");
    await waitText(report.content ?? "");
    expect(mocks.reports).toHaveBeenCalledTimes(2);
  });

  it("só pune após confirmar, bloqueia repetição e reconcilia a fila", async () => {
    let complete: (value: ReportView) => void = () => {
      throw new Error("Punição não iniciada");
    };
    mocks.penalize.mockImplementation(
      () =>
        new Promise<ReportView>((resolve) => {
          complete = resolve;
        }),
    );
    mocks.reports.mockResolvedValueOnce([report]).mockResolvedValue([]);
    await render();
    await waitText(report.content ?? "");
    await click("Punir agora");
    expect(mocks.penalize).not.toHaveBeenCalled();
    await click("Cancelar", dialog());
    expect(mocks.penalize).not.toHaveBeenCalled();
    await click("Punir agora");
    const confirm = button("Punir agora", dialog());
    await act(async () => {
      confirm.click();
      confirm.click();
    });
    await vi.waitFor(() => expect(mocks.penalize).toHaveBeenCalledTimes(1));
    expect(mocks.penalize).toHaveBeenCalledWith(report.reportId);
    await act(async () => complete(decision));
    await vi.waitFor(() => expect(mocks.reports).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(host.textContent).not.toContain(report.content);
    expect(mocks.vote).not.toHaveBeenCalled();
  });

  it("mantém a votação normal e não oferece punição direta para não-admin", async () => {
    mocks.vote.mockResolvedValue({ message: "Voto sintético registrado.", status: "PENDING" });
    await render(false);
    await waitText(report.content ?? "");
    expect(document.body.textContent).not.toContain("Punir agora");
    expect(document.body.textContent).toContain("6");
    const voteButton = [...host.querySelectorAll("button")].find((item) =>
      /votar.*punir/i.test(item.textContent ?? ""),
    );
    expect(voteButton).toBeDefined();
    await act(async () => voteButton?.click());
    await vi.waitFor(() => expect(mocks.vote).toHaveBeenCalledWith(report.reportId, "PUNISH"));
    expect(mocks.penalize).not.toHaveBeenCalled();
  });

  it("mantém o contexto da confirmação após falha e permite nova tentativa", async () => {
    mocks.penalize.mockRejectedValueOnce(new Error("Falha sintética")).mockResolvedValue(decision);
    await render();
    await waitText(report.content ?? "");
    await click("Punir agora");
    await click("Punir agora", dialog());
    await vi.waitFor(() => expect(dialog().querySelector('[role="alert"]')).not.toBeNull());
    expect(host.textContent).toContain(report.content);
    await click("Punir agora", dialog());
    await vi.waitFor(() => expect(mocks.penalize).toHaveBeenCalledTimes(2));
  });

  it("reconcilia uma denúncia já decidida e fecha a confirmação obsoleta", async () => {
    mocks.penalize.mockRejectedValue(
      new ApiError(409, "ALREADY_REVIEWED", "Decisão já registrada."),
    );
    mocks.reports.mockResolvedValueOnce([report]).mockResolvedValue([]);
    await render();
    await waitText(report.content ?? "");
    await click("Punir agora");
    await click("Punir agora", dialog());
    await vi.waitFor(() => expect(mocks.reports).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(host.textContent).not.toContain(report.content);
    expect(mocks.penalize).toHaveBeenCalledTimes(1);
    expect(mocks.vote).not.toHaveBeenCalled();
  });

  it("não transporta o erro de uma ação cancelada para outra confirmação", async () => {
    mocks.penalize.mockRejectedValue(new Error("Falha sintética"));
    await render();
    await waitText(report.content ?? "");
    await click("Punir agora");
    await click("Punir agora", dialog());
    await vi.waitFor(() => expect(dialog().querySelector('[role="alert"]')).not.toBeNull());
    await click("Cancelar", dialog());
    await click("Enviar advertência");
    expect(dialog().querySelector('[role="alert"]')).toBeNull();
    expect(mocks.warn).not.toHaveBeenCalled();
    expect(mocks.penalize).toHaveBeenCalledTimes(1);
  });

  it.each([
    { targetType: "COMPANY", authorId: "dono_ficticio" },
    { targetType: "JOB", authorId: "dono_ficticio" },
    { targetType: "POST", authorId: null },
  ])("não oferece punição direta para alvo não suportado: %j", async (override) => {
    mocks.reports.mockResolvedValue([{ ...report, ...override }]);
    await render();
    await waitText(report.content ?? "");
    expect(document.body.textContent).not.toContain("Punir agora");
    expect(mocks.penalize).not.toHaveBeenCalled();
  });
});
