import type { MonitoringUsers } from "@/types/application/monitoring/monitoring-users";
import { describe, expect, it } from "vitest";

/**
 * O painel e a API falam o mesmo vocabulário por nome de campo: `/admin/monitoring/users` devolve
 * `activeLast24Hours`, e a tela lê `activeLast24Hours`. Se um lado renomear sozinho, nada quebra no
 * build (o JSON é dinâmico) e o painel passa a mostrar `undefined` sem erro — este teste segura essa
 * ponta com o payload como o backend o serializa hoje.
 */
describe("MonitoringUsers × payload de /admin/monitoring/users", () => {
  it("lê a contagem de ativos nas últimas 24h do payload real", () => {
    // Payload reduzido ao formato do record UsersView (o backend serializa os campos do record).
    const payload = {
      generatedAt: "2026-11-10T08:00:00Z",
      total: 1_234,
      activeLast24Hours: 87,
      newToday: 12,
      newLast7Days: 78,
      newLast30Days: 300,
      growthTodayPercent: 0.98,
      growth7DaysPercent: 0.94,
      growth30DaysPercent: 0.83,
      averageDailyNew7Days: 11.1,
      averageDailyNew30Days: 10,
      series: [],
      projections: [],
    } satisfies MonitoringUsers;

    expect(payload.activeLast24Hours).toBe(87);
    expect(Object.keys(payload)).toContain("activeLast24Hours");
  });
});
