import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";

const mine = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ sanctionsApi: { mine, appeal: vi.fn() } }));
const { SanctionsContainer } = await import("./sanctions-container");

it("mantém carregamento no SSR sem afirmar ausência de sanções antes de consultar", () => {
  const client = new QueryClient();
  try {
    const html = renderToString(
      <QueryClientProvider client={client}>
        <SanctionsContainer mode="suspended" />
      </QueryClientProvider>,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("Carregando");
    expect(html).not.toContain("Nenhuma penalidade");
    expect(mine).not.toHaveBeenCalled();
  } finally {
    client.clear();
  }
});
