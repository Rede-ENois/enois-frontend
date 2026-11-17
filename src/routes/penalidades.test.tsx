// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mine: vi.fn(),
  appeal: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/api", () => ({
  sanctionsApi: { mine: mocks.mine, appeal: mocks.appeal },
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  LoadingState: () => <div>carregando</div>,
  Textarea: () => null,
  useToast: () => ({ toast: vi.fn() }),
}));

const { Route } = await import("./penalidades");
const Penalidades = (Route as unknown as { options: { component: () => React.JSX.Element } })
  .options.component;

describe("/penalidades", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Penalidades />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.mine.mockReset();
    mocks.appeal.mockReset();
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

  it("falha de consulta mostra erro com Tentar novamente, nunca 'nenhuma penalidade'", async () => {
    mocks.mine.mockRejectedValue(new Error("rede caiu"));
    await render();

    expect(host.textContent).toContain("Não foi possível consultar suas penalidades.");
    expect(host.textContent).toContain("Tentar novamente");
    expect(host.textContent).not.toContain("Nenhuma penalidade na sua conta.");

    mocks.mine.mockResolvedValue({ sanctions: [], appeals: [] });
    await act(async () =>
      [...host.querySelectorAll("button")]
        .find((b) => b.textContent === "Tentar novamente")!
        .click(),
    );
    await settle();

    expect(host.textContent).toContain("Nenhuma penalidade na sua conta.");
    expect(host.textContent).not.toContain("Não foi possível consultar suas penalidades.");
  });

  it("consulta bem-sucedida sem sanções mostra o vazio, não o erro", async () => {
    mocks.mine.mockResolvedValue({ sanctions: [], appeals: [] });
    await render();

    expect(host.textContent).toContain("Nenhuma penalidade na sua conta.");
    expect(host.textContent).not.toContain("Não foi possível consultar suas penalidades.");
  });
});
