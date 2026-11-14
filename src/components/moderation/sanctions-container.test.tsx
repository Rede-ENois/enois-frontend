// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { MySanctionsResponse } from "@/types/application/moderation/my-sanctions-response";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mine: vi.fn(), appeal: vi.fn() }));
vi.mock("@/lib/api", () => ({ sanctionsApi: mocks }));
const { SanctionsContainer } = await import("./sanctions-container");
let host: HTMLDivElement;
let root: Root;
let client: QueryClient;

function fixture(): MySanctionsResponse {
  return {
    serverNow: "2026-01-01T12:00:00Z",
    sanctions: [
      {
        id: "sanc_sintetica",
        userId: "user_sintetico",
        reportId: "report_sintetico",
        type: "SUSPENDED",
        status: "ACTIVE",
        reason: "Motivo sintético da suspensão",
        createdAt: "2026-01-01T11:00:00Z",
        removedAt: null,
        deadline: { kind: "APPEAL", at: "2026-01-01T14:00:00Z" },
        evidence: { kind: "TEXT", text: "Publicação sintética associada ao caso" },
        canAppeal: true,
      },
    ],
    appeals: [],
  };
}
async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <SanctionsContainer mode="suspended" />
      </QueryClientProvider>,
    ),
  );
}
async function settled() {
  await act(async () => new Promise<void>((done) => setTimeout(done, 0)));
}
async function waitText(text: string) {
  await vi.waitFor(async () => {
    await settled();
    expect(host.textContent).toContain(text);
  });
}
async function fillMessage(message: string) {
  const input = host.querySelector("textarea");
  if (!input) throw new Error("Formulário não disponível");
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(input, message);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const send = () => [...host.querySelectorAll("button")].find((b) => b.textContent === "Recorrer");

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  mocks.mine.mockReset();
  mocks.appeal.mockReset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  host.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("conta suspensa: integração da view com a decisão", () => {
  it("consulta sem depender do indicador de sessão normal e mostra motivo, evidência e prazo", async () => {
    mocks.mine.mockResolvedValue(fixture());
    await render();
    await waitText("Motivo sintético da suspensão");
    expect(mocks.mine).toHaveBeenCalledOnce();
    expect(host.textContent).toContain("Publicação sintética associada ao caso");
    expect(host.textContent).toContain("Prazo para recorrer");
    expect(host.textContent).toContain("Restam 2h 0min");
    expect(host.textContent).toContain("não a liberação automática");
    expect(host.textContent).not.toContain("Término da punição");
    expect(send()).toBeDefined();
  });
  it("não oferece novo recurso quando o servidor informa pendência", async () => {
    const data = fixture();
    data.sanctions[0].canAppeal = false;
    data.appeals.push({
      id: "appeal_sintetico",
      sanctionId: "sanc_sintetica",
      userId: "user_sintetico",
      message: "Contestação sintética",
      status: "PENDING",
      createdAt: data.serverNow,
      reviewedBy: null,
      reviewedAt: null,
    });
    mocks.mine.mockResolvedValue(data);
    await render();
    await waitText("Recurso em análise");
    expect(host.querySelector("textarea")).toBeNull();
    expect(send()).toBeUndefined();
  });
  it("envia texto aparado uma única vez e reconcilia o acompanhamento", async () => {
    mocks.mine.mockResolvedValue(fixture());
    await render();
    await waitText("Motivo sintético da suspensão");
    await fillMessage("   Contexto sintético para revisão humana   ");
    let finish: (value: { id: string; status: string }) => void = () => {
      throw new Error("Envio não iniciado");
    };
    mocks.appeal.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await act(async () => {
      send()?.click();
      send()?.click();
    });
    await settled();
    expect(mocks.appeal).toHaveBeenCalledTimes(1);
    expect(mocks.appeal).toHaveBeenCalledWith("Contexto sintético para revisão humana");
    const pending = fixture();
    pending.sanctions[0].canAppeal = false;
    pending.appeals.push({
      id: "appeal_sintetico",
      sanctionId: "sanc_sintetica",
      userId: "user_sintetico",
      message: "Contexto sintético para revisão humana",
      status: "PENDING",
      createdAt: pending.serverNow,
      reviewedBy: null,
      reviewedAt: null,
    });
    mocks.mine.mockResolvedValue(pending);
    await act(async () => finish({ id: "appeal_sintetico", status: "PENDING" }));
    await waitText("Recurso em análise");
    expect(host.querySelector("textarea")).toBeNull();
  });
  it("preserva o texto e permite nova tentativa após falha de envio", async () => {
    mocks.mine.mockResolvedValue(fixture());
    mocks.appeal.mockRejectedValue(new Error("Falha sintética no envio"));
    await render();
    await waitText("Motivo sintético da suspensão");
    await fillMessage("Recurso sintético para análise");
    await act(async () => send()?.click());
    await waitText("Não foi possível enviar seu recurso.");
    expect(host.querySelector("textarea")?.value).toBe("Recurso sintético para análise");
    expect(send()?.disabled).toBe(false);
  });
  it("mostra a decisão removida sem afirmar que a conta continua suspensa", async () => {
    const data = fixture();
    data.sanctions[0].status = "REMOVED";
    data.sanctions[0].canAppeal = false;
    mocks.mine.mockResolvedValue(data);
    await render();
    await waitText("Minhas penalidades");
    expect(host.querySelector("h1")?.textContent).not.toBe("Conta suspensa");
    expect(host.querySelector('a[href="/entrar?tab=login"]')).not.toBeNull();
  });
});
