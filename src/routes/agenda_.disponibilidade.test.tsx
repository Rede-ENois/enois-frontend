// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuth } from "@/lib/require-auth";

/**
 * A tela de disponibilidade desenha com o `CalendarAvailabilitySurface` do Design System; aqui
 * ficam as decisões da rota: sessão obrigatória, o título da página e o que a tela faz quando a
 * semana não carrega. O desenho e a validação da semana são do DS, testados lá.
 */

const mocks = vi.hoisted(() => ({
  availability: vi.fn(),
  setAvailability: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
}));
vi.mock("@/lib/api", () => ({
  calendarApi: {
    availability: mocks.availability,
    setAvailability: mocks.setAvailability,
  },
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./agenda_.disponibilidade");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const AvailabilityPage = (options as { component: () => React.JSX.Element }).component;

describe("rota /agenda/disponibilidade", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <AvailabilityPage />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.availability.mockReset();
    mocks.setAvailability.mockReset();
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

  it("pede sessão antes de desenhar: a semana é do dono", () => {
    expect(options.beforeLoad).toBe(requireAuth);
  });

  it("nomeia a página para a aba do navegador", () => {
    const head = options.head as () => { meta: { title: string }[] };
    expect(head().meta[0].title).toBe("Disponibilidade · Énóis");
  });

  it("sem a semana do servidor, não oferece salvar uma semana vazia", async () => {
    // Um erro de leitura antes se desenhava como semana vazia; salvar ali apagaria a
    // disponibilidade que nunca chegou a ser lida.
    mocks.availability.mockRejectedValue(new Error("offline"));
    await render();

    expect(host.textContent).toContain("Não foi possível carregar sua disponibilidade.");
    expect(host.querySelector("form")).toBeNull();
    expect(host.textContent).not.toContain("Salvar");
  });

  it("oferece recarregar em vez de deixar a tela sem saída", async () => {
    mocks.availability.mockRejectedValueOnce(new Error("offline"));
    await render();

    const retry = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Tentar de novo",
    );
    expect(retry).toBeDefined();

    mocks.availability.mockResolvedValueOnce([]);
    await act(async () => retry!.click());
    await settle();

    expect(host.querySelector("form")).not.toBeNull();
  });
});
