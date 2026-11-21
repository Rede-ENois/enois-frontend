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
  serverNow: "2026-11-14T12:00:00Z",
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
      deadline: { kind: "APPEAL", at: "2026-11-17T12:00:00Z" },
      evidence: { kind: "UNAVAILABLE", text: null },
      canAppeal: true,
    },
  ],
  appeals: [],
};

let root: Root;
let host: HTMLDivElement;
let client: QueryClient;

async function renderPage(expectedText = "Spam repetido na rede.") {
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
  // A view mantém uma região de status após carregar; aguardamos o conteúdo, não sua remoção.
  await vi.waitFor(
    async () => {
      await act(async () => new Promise<void>((resolve) => setTimeout(resolve, 0)));
      expect(host.textContent).toContain(expectedText);
    },
    { timeout: 10_000 },
  );
}

describe("Penalidades", () => {
  beforeEach(() => {
    mocks.mine.mockReturnValue(Promise.resolve(FIXTURE));
  });

  afterEach(() => {
    act(() => root?.unmount());
    client?.clear();
    document.body.replaceChildren();
  });

  it("mostra o motivo e o prazo da suspensão ativa", async () => {
    await renderPage();

    expect(host.textContent).toContain("Spam repetido na rede.");
    expect(host.textContent).toContain("Motivo");
    expect(host.textContent).toContain("Prazo para recorrer");
    expect(host.textContent).toContain("17/11/2026, 12:00:00 UTC");
    expect(host.textContent).toContain("Esta suspensão pode resultar em banimento.");
    expect(host.textContent).toContain("não a liberação automática da conta");
  });

  it("não inventa prazo quando a sanção não tem prazo informado", async () => {
    mocks.mine.mockReturnValue(
      Promise.resolve({
        ...FIXTURE,
        sanctions: [{ ...FIXTURE.sanctions[0], dueAt: null, deadline: { kind: "NONE", at: null } }],
      }),
    );
    await renderPage();

    expect(host.textContent).toContain("Spam repetido na rede.");
    expect(host.textContent).toContain("Sem prazo definido");
    expect(host.textContent).not.toContain("Prazo para recorrer");
    expect(host.querySelector('time[datetime="2026-11-17T12:00:00Z"]')).toBeNull();
  });

  it("usa o prazo com significado explícito sem depender do campo legado dueAt", async () => {
    mocks.mine.mockReturnValue(
      Promise.resolve({ ...FIXTURE, sanctions: [{ ...FIXTURE.sanctions[0], dueAt: null }] }),
    );
    await renderPage();
    expect(host.textContent).toContain("Prazo para recorrer");
    expect(host.textContent).toContain("17/11/2026, 12:00:00 UTC");
  });

  it("consulta que falha mostra erro com Tentar novamente, nunca 'nenhuma penalidade'", async () => {
    mocks.mine.mockReset();
    mocks.mine.mockRejectedValue(new Error("Falha sintética na consulta"));
    await renderPage("Não foi possível carregar suas penalidades.");

    expect(host.textContent).toContain("Tentar novamente");
    expect(host.textContent).not.toContain("Nenhuma penalidade na sua conta.");
    expect(host.textContent).not.toContain("Nenhuma penalidade encontrada.");

    mocks.mine.mockResolvedValue({ ...FIXTURE, sanctions: [], appeals: [] });
    const retry = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Tentar novamente",
    );
    expect(retry).toBeDefined();
    await act(async () => retry?.click());
    await vi.waitFor(
      async () => {
        await act(async () => new Promise<void>((resolve) => setTimeout(resolve, 0)));
        expect(host.textContent).toContain("Nenhuma penalidade encontrada.");
      },
      { timeout: 10_000 },
    );
    expect(host.textContent).not.toContain("Não foi possível carregar suas penalidades.");
    expect(mocks.mine).toHaveBeenCalledTimes(2);
  });
});
