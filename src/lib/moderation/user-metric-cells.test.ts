import { texts } from "@/texts";
import type { MonitoringUsers } from "@/types/application/monitoring/monitoring-users";
import { describe, expect, it } from "vitest";

import { userMetricCells } from "@/lib/moderation/user-metric-cells";

const base: MonitoringUsers = {
  generatedAt: "2026-11-10T08:00:00Z",
  total: 1234,
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
};

describe("userMetricCells", () => {
  it("põe os ativos das últimas 24h ao lado do total, em pt-BR", () => {
    const celulas = userMetricCells(base);

    const rotulos = celulas.map(([rotulo]) => rotulo);
    expect(rotulos[0]).toBe(texts.userMetrics.total);
    expect(rotulos[1]).toBe(texts.userMetrics.active24h);

    const valores = Object.fromEntries(celulas);
    expect(valores[texts.userMetrics.total]).toBe("1.234");
    expect(valores[texts.userMetrics.active24h]).toBe("87");
    expect(valores[texts.userMetrics.newToday]).toBe("12");
  });

  it("sinaliza crescimento positivo e não perde casa decimal", () => {
    const valores = Object.fromEntries(userMetricCells(base));

    expect(valores[texts.userMetrics.growthToday]).toBe("+0,98%");
    expect(valores[texts.userMetrics.average7]).toBe("11,1");
  });

  it("não inventa sinal para crescimento zero ou negativo", () => {
    const valores = Object.fromEntries(
      userMetricCells({ ...base, growthTodayPercent: 0, growth7DaysPercent: -1.5 }),
    );

    expect(valores[texts.userMetrics.growthToday]).toBe("0,00%");
    expect(valores[texts.userMetrics.growth7]).toBe("-1,50%");
  });
});
