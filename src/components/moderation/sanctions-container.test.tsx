// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { MySanctionsResponse } from "@/types/application/moderation/my-sanctions-response";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registerBrowserQueryClient, resetSessionScopedData } from "@/lib/query-client";

const mocks = vi.hoisted(() => ({ mine: vi.fn(), appeal: vi.fn() }));
vi.mock("@/lib/api", () => ({ sanctionsApi: mocks }));
const { SanctionsContainer } = await import("./sanctions-container");
let host: HTMLDivElement;
let root: Root;
let client: QueryClient;
let removeStorageListener = () => {};

function observeAccountChanges() {
  const subscriptions = vi.spyOn(window, "addEventListener");
  registerBrowserQueryClient(client);
  const listener = subscriptions.mock.calls.find(([event]) => event === "storage")?.[1];
  subscriptions.mockRestore();
  if (!listener) throw new Error("Observador de identidade não registrado");
  removeStorageListener = () => window.removeEventListener("storage", listener);
}

function changeAccount() {
  localStorage.setItem("session_id", "geracao_sintetica_B");
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "session_id",
      oldValue: "geracao_sintetica_A",
      newValue: "geracao_sintetica_B",
      storageArea: localStorage,
    }),
  );
}

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
async function render(mode: "history" | "suspended" = "suspended") {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <SanctionsContainer mode={mode} />
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
  removeStorageListener();
  removeStorageListener = () => {};
  client.clear();
  host.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("conta suspensa: integração da view com a decisão", () => {
  it("descarta o rascunho quando outra aba troca a identidade com o container montado", async () => {
    localStorage.setItem("session_id", "geracao_sintetica_A");
    localStorage.setItem("sanction_access", "1");
    observeAccountChanges();
    mocks.mine.mockResolvedValue(fixture());
    await render();
    await waitText("Motivo sintético da suspensão");
    await fillMessage("Rascunho sintético exclusivo da conta A");
    const next = fixture();
    next.sanctions[0].userId = "conta_sintetica_B";
    next.sanctions[0].reason = "Decisão sintética da conta B";
    mocks.mine.mockResolvedValue(next);
    await act(async () => changeAccount());
    await waitText("Decisão sintética da conta B");
    expect(host.querySelector("textarea")?.value).toBe("");
    expect(host.textContent).not.toContain("Motivo sintético da suspensão");
    expect(mocks.appeal).not.toHaveBeenCalled();
  });

  it("ignora a conclusão do recurso anterior sem apagar ou revalidar a nova identidade", async () => {
    localStorage.setItem("session_id", "geracao_sintetica_A");
    localStorage.setItem("sanction_access", "1");
    observeAccountChanges();
    mocks.mine.mockResolvedValue(fixture());
    await render();
    await waitText("Motivo sintético da suspensão");
    await fillMessage("Recurso sintético da conta A");
    let finish = (_value: { id: string; status: string }) => {};
    mocks.appeal.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await act(async () => send()?.click());
    const next = fixture();
    next.sanctions[0].userId = "conta_sintetica_B";
    next.sanctions[0].reason = "Decisão sintética da conta B";
    mocks.mine.mockResolvedValue(next);
    await act(async () => changeAccount());
    await waitText("Decisão sintética da conta B");
    expect(host.querySelector("textarea")?.disabled).toBe(false);
    await fillMessage("Rascunho sintético exclusivo da conta B");
    await settled();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await act(async () => finish({ id: "recurso_sintetico_A", status: "PENDING" }));
    await settled();
    expect(host.querySelector("textarea")?.value).toBe("Rascunho sintético exclusivo da conta B");
    expect(send()?.disabled).toBe(false);
    expect(invalidate).not.toHaveBeenCalled();
    expect(mocks.appeal).toHaveBeenCalledTimes(1);
  });

  it.each(["outra aba", "esta aba"])(
    "descarta o rascunho de acesso limitado sem chave de sessão após troca em %s",
    async (origin) => {
      localStorage.setItem("sanction_access", "1");
      observeAccountChanges();
      mocks.mine.mockResolvedValue(fixture());
      await render();
      await waitText("Motivo sintético da suspensão");
      await fillMessage("Rascunho sintético de acesso limitado anterior");
      const next = fixture();
      next.sanctions[0].userId = "conta_sintetica_B";
      next.sanctions[0].reason = "Decisão sintética da conta B";
      mocks.mine.mockResolvedValue(next);
      await act(async () => {
        if (origin === "esta aba") return resetSessionScopedData();
        for (const [oldValue, newValue] of [
          ["1", null],
          [null, "1"],
        ]) {
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "sanction_access",
              oldValue,
              newValue,
              storageArea: localStorage,
            }),
          );
        }
      });
      await waitText("Decisão sintética da conta B");
      expect(host.querySelector("textarea")?.value).toBe("");
    },
  );

  it("não despacha um recurso enfileirado depois de substituir a sessão", async () => {
    localStorage.setItem("session_id", "geracao_sintetica_A");
    observeAccountChanges();
    mocks.mine.mockResolvedValue(fixture());
    mocks.appeal.mockResolvedValue({ id: "recurso_sintetico_A", status: "PENDING" });
    await render();
    await waitText("Motivo sintético da suspensão");
    await fillMessage("Recurso sintético exclusivo da conta A");
    const next = fixture();
    next.sanctions[0].reason = "Decisão sintética da conta B";
    mocks.mine.mockResolvedValue(next);
    await act(async () => {
      send()?.click();
      changeAccount();
    });
    await waitText("Decisão sintética da conta B");
    await settled();
    expect(mocks.appeal).not.toHaveBeenCalled();
    expect(host.querySelector("textarea")?.value).toBe("");
  });

  it("preserva o rascunho durante a revalidação da mesma identidade", async () => {
    localStorage.setItem("session_id", "geracao_sintetica_A");
    mocks.mine.mockResolvedValue(fixture());
    await render();
    await waitText("Motivo sintético da suspensão");
    await fillMessage("Rascunho sintético da mesma identidade");
    const updated = fixture();
    updated.sanctions[0].reason = "Decisão sintética revalidada";
    mocks.mine.mockResolvedValue(updated);
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["my-sanctions"] });
    });
    await waitText("Decisão sintética revalidada");
    expect(host.querySelector("textarea")?.value).toBe("Rascunho sintético da mesma identidade");
  });

  it.each(["history", "suspended"] as const)(
    "consulta novamente a cada entrada com cache recente e prazo aberto (%s)",
    async (mode) => {
      client.setDefaultOptions({ queries: { retry: false, staleTime: 30_000 } });
      const initial = fixture();
      const updated = fixture();
      updated.sanctions[0].reason = "Decisão sintética atualizada durante a navegação";
      mocks.mine.mockResolvedValueOnce(initial).mockResolvedValue(updated);
      await render(mode);
      await waitText("Motivo sintético da suspensão");
      expect(mocks.mine).toHaveBeenCalledOnce();
      await act(async () => root.render(null));
      await render(mode);
      await vi.waitFor(async () => {
        await settled();
        expect(mocks.mine).toHaveBeenCalledTimes(2);
      });
      await waitText("Decisão sintética atualizada durante a navegação");
      expect(host.textContent).not.toContain("Motivo sintético da suspensão");
    },
  );
  it("mantém a observação original do snapshot e revalida o prazo vencido ao remontar", async () => {
    const monotonic = vi.spyOn(performance, "now").mockReturnValue(0);
    client.setDefaultOptions({ queries: { retry: false, staleTime: 30_000 } });
    const initial = fixture();
    initial.sanctions[0].deadline.at = "2026-01-01T12:00:10Z";
    mocks.mine
      .mockResolvedValueOnce(initial)
      .mockResolvedValue({ ...initial, serverNow: "2026-01-01T12:00:20Z" });
    try {
      await render();
      await waitText("Motivo sintético da suspensão");
      expect(mocks.mine).toHaveBeenCalledTimes(1);
      await act(async () => root.render(null));
      monotonic.mockReturnValue(20_000);
      await render();
      await waitText("Prazo encerrado");
      expect(mocks.mine).toHaveBeenCalledTimes(2);
    } finally {
      monotonic.mockRestore();
    }
  });
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
