import { QueryClient } from "@tanstack/react-query";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { calendarApi } from "@/lib/api";

import { calendarQueries } from "./calendar";

vi.mock("@/lib/api", () => ({
  calendarApi: { conflicts: vi.fn() },
}));

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

beforeEach(() => vi.clearAllMocks());

/**
 * O aviso de conflito da `/agenda` é uma leitura da janela visível, sem escopo: trocar de aba não
 * pode buscar de novo, e a lista é a mesma para as duas agendas.
 */
describe("consulta de conflito da agenda", () => {
  const window = { from: "2026-11-01T03:00:00.000Z", to: "2026-12-01T03:00:00.000Z" };

  it("não inclui o escopo na chave nem na consulta", async () => {
    vi.mocked(calendarApi.conflicts).mockResolvedValue([]);

    const query = calendarQueries.conflicts(window);

    expect(query.queryKey).toEqual(["agenda", "conflitos", window.from, window.to]);
    await query.queryFn?.({} as never);
    expect(calendarApi.conflicts).toHaveBeenCalledWith(window);
  });

  it("reaproveita a mesma leitura para a mesma janela", async () => {
    vi.mocked(calendarApi.conflicts).mockResolvedValue([]);
    const client = createClient();

    await Promise.all([
      client.fetchQuery(calendarQueries.conflicts(window)),
      client.fetchQuery(calendarQueries.conflicts(window)),
    ]);

    expect(calendarApi.conflicts).toHaveBeenCalledTimes(1);
  });
});
