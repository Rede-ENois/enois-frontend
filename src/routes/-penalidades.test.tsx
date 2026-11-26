// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mine: vi.fn(), appeal: vi.fn(), toast: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/lib/api", () => ({ sanctionsApi: { mine: mocks.mine, appeal: mocks.appeal } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useToast: () => ({ toast: mocks.toast }),
}));

const { Route } = await import("./penalidades");
const Penalidades = (Route as unknown as { options: { component: () => React.JSX.Element } })
  .options.component;

let root: Root;
let host: HTMLDivElement;
let client: QueryClient;
const emptyMessage = "Nenhuma penalidade encontrada.";
const errorMessage = "Não foi possível carregar suas penalidades.";

async function render() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Penalidades />
      </QueryClientProvider>,
    );
  });
}

async function waitForText(text: string) {
  await vi.waitFor(async () => {
    await act(async () => new Promise<void>((done) => setTimeout(done, 0)));
    expect(host.textContent).toContain(text);
  });
}

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
  client.clear();
  host.remove();
  vi.unstubAllGlobals();
});

describe("consulta das próprias penalidades", () => {
  it("não confunde falha na consulta com ausência de penalidades", async () => {
    mocks.mine.mockRejectedValue(new Error("Falha sintética na consulta"));
    await render();
    await waitForText(errorMessage);

    expect(host.textContent).not.toContain(emptyMessage);
    expect(
      [...host.querySelectorAll("button")].some((b) => b.textContent === "Tentar novamente"),
    ).toBe(true);
  });

  it("mostra ausência de penalidades somente após consulta bem-sucedida", async () => {
    mocks.mine.mockResolvedValue({ sanctions: [], appeals: [] });
    await render();
    await waitForText(emptyMessage);
    expect(host.textContent).not.toContain(errorMessage);
  });

  it.each(["vazia", "com penalidade"])(
    "recupera uma consulta %s pelo botão de tentar novamente",
    async (state) => {
      mocks.mine.mockRejectedValueOnce(new Error("Falha sintética"));
      await render();
      await waitForText(errorMessage);
      mocks.mine.mockResolvedValue({
        sanctions:
          state === "vazia"
            ? []
            : [
                {
                  id: "sanc_sintetica",
                  type: "RESTRICTION",
                  status: "ACTIVE",
                  reason: "Motivo sintético da penalidade",
                  createdAt: "2026-01-01T12:00:00Z",
                  deadline: { kind: "NONE", at: null },
                  evidence: { kind: "UNAVAILABLE", text: null },
                  canAppeal: true,
                },
              ],
        appeals: [],
      });

      const retry = [...host.querySelectorAll("button")].find(
        (b) => b.textContent === texts.sanctions.retry,
      );
      await act(async () => retry?.click());
      await waitForText(state === "vazia" ? emptyMessage : "Motivo sintético da penalidade");
      expect(host.textContent).not.toContain(errorMessage);
      expect(mocks.mine).toHaveBeenCalledTimes(2);
    },
  );

  it("mantém erro explícito quando uma nova tentativa falha", async () => {
    mocks.mine.mockRejectedValue(new Error("Falha sintética persistente"));
    await render();
    await waitForText(errorMessage);
    const retry = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === texts.sanctions.retry,
    );
    await act(async () => retry?.click());
    await waitForText(errorMessage);
    expect(host.textContent).not.toContain(emptyMessage);
    expect(mocks.mine).toHaveBeenCalledTimes(2);
  });

  it("não afirma ausência quando a atualização de uma lista vazia falha", async () => {
    mocks.mine.mockResolvedValueOnce({ sanctions: [], appeals: [] });
    await render();
    await waitForText(emptyMessage);
    mocks.mine.mockRejectedValue(new Error("Falha sintética na atualização"));
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["my-sanctions"] });
    });
    await waitForText(errorMessage);
    expect(host.textContent).not.toContain(emptyMessage);
  });

  it("não duplica a consulta enquanto uma tentativa está em andamento", async () => {
    mocks.mine.mockRejectedValueOnce(new Error("Falha sintética"));
    await render();
    await waitForText(errorMessage);
    let resolveQuery: (value: { sanctions: []; appeals: [] }) => void = () => undefined;
    mocks.mine.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveQuery = resolve;
        }),
    );
    const retry = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === texts.sanctions.retry,
    );
    await act(async () => retry?.click());
    await vi.waitFor(async () => {
      await act(async () => new Promise<void>((done) => setTimeout(done, 0)));
      const availableRetry = [...host.querySelectorAll("button")].find(
        (b) => b.textContent === texts.sanctions.retry,
      );
      expect(availableRetry?.disabled ?? true).toBe(true);
    });
    await act(async () => retry?.click());
    expect(mocks.mine).toHaveBeenCalledTimes(2);
    await act(async () => resolveQuery({ sanctions: [], appeals: [] }));
    await waitForText(emptyMessage);
  });
});
