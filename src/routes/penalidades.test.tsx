// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { Route } = await import("./penalidades");
const Penalidades = (Route as unknown as { options: { component: () => React.JSX.Element } })
  .options.component;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Regressão da issue #922: quem é punido descobria a punição pelos efeitos, sem motivo nem prazo,
 * e abria ticket de suporte para cada caso. A página de penalidades tem que dizer o motivo da
 * sanção ativa e, na suspensão, a data em que ela revisa.
 */

const mocks = vi.hoisted(() => ({ mine: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
    useNavigate: () => () => undefined,
  }),
  useNavigate: () => () => undefined,
  Link: (props: Record<string, unknown>) => <a {...props} />,
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/api", () => ({
  sanctionsApi: { mine: () => mocks.mine(), appeal: vi.fn() },
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});

const FIXTURE = {
  sanctions: [
    {
      id: "s1",
      userId: "u1",
      reportId: null,
      type: "SUSPENDED",
      reason: "Spam repetido na rede.",
      status: "ACTIVE",
      createdAt: "2026-11-10T12:00:00Z",
      removedAt: null,
      dueAt: "2026-11-17T12:00:00Z",
    },
  ],
  appeals: [],
};

let root: Root;
let host: HTMLDivElement;
let client: QueryClient;

async function renderPage() {
  host = document.createElement("div");
  document.body.appendChild(host);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    root = createRoot(host);
    root.render(
      <QueryClientProvider client={client}>
        <Penalidades />
      </QueryClientProvider>,
    );
  });
  // A query resolve em microtasks encadeadas (react-query notifica o observador em job separado):
  // gira o act até a página sair do estado de carregamento. Sob carga (suíte inteira no CI) a
  // microtask pode demorar mais que o esperado — o teto alto é folga, o teste falha por asserção
  // de conteúdo e não por corrida com o scheduler.
  for (let turn = 0; turn < 100 && host.querySelector('[role="status"]'); turn += 1) {
    await act(async () => {});
  }
}

describe("Penalidades", () => {
  beforeEach(() => {
    mocks.mine.mockReturnValue(Promise.resolve(FIXTURE));
  });

  afterEach(() => {
    act(() => root?.unmount());
    document.body.replaceChildren();
  });

  it("mostra o motivo e o prazo da suspensão ativa", async () => {
    await renderPage();

    expect(host.textContent).toContain("Spam repetido na rede.");
    expect(host.textContent).toContain("Motivo: Spam repetido na rede.");
    expect(host.textContent).toMatch(/Revisável até/);
    expect(host.textContent).toMatch(/vira banimento/);
  });

  it("consulta que falha mostra erro com Tentar novamente, nunca 'nenhuma penalidade'", async () => {
    mocks.mine.mockReturnValue(Promise.reject(new Error("rede caiu")));
    await renderPage();

    expect(host.textContent).toContain("Não foi possível consultar suas penalidades.");
    expect(host.textContent).toContain("Tentar novamente");
    expect(host.textContent).not.toContain("Nenhuma penalidade na sua conta.");

    mocks.mine.mockReturnValue(Promise.resolve({ sanctions: [], appeals: [] }));
    await act(async () =>
      [...host.querySelectorAll("button")]
        .find((b) => b.textContent === "Tentar novamente")!
        .click(),
    );
    for (let turn = 0; turn < 100 && host.querySelector('[role="status"]'); turn += 1) {
      await act(async () => {});
    }

    expect(host.textContent).toContain("Nenhuma penalidade na sua conta.");
    expect(host.textContent).not.toContain("Não foi possível consultar suas penalidades.");
  });

  it("não inventa prazo quando a sanção não tem dueAt", async () => {
    mocks.mine.mockReturnValue(
      Promise.resolve({ ...FIXTURE, sanctions: [{ ...FIXTURE.sanctions[0], dueAt: null }] }),
    );
    await renderPage();

    expect(host.textContent).toContain("Motivo: Spam repetido na rede.");
    expect(host.textContent).not.toMatch(/Revisável até/);
  });
});
