// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import type { MonitoringUsers } from "@/types/application/monitoring/monitoring-users";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { UsersCard } from "@/components/moderation/monitoring-section";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const dia = (date: string, newUsers: number, total: number, growthPercent: number) => ({
  date,
  newUsers,
  total,
  growthPercent,
});

const base: MonitoringUsers = {
  generatedAt: "2026-10-30T12:00:00Z",
  total: 1_234,
  newToday: 12,
  newLast7Days: 78,
  newLast30Days: 300,
  growthTodayPercent: 0.98,
  growth7DaysPercent: 0.94,
  growth30DaysPercent: 0.83,
  averageDailyNew7Days: 11.1,
  averageDailyNew30Days: 10,
  series: [
    dia("2026-10-28", 10, 1_212, 0.83),
    dia("2026-10-29", 10, 1_222, 0.83),
    dia("2026-10-30", 12, 1_234, 0.98),
  ],
  projections: [
    { days: 7, total: 1_312, growthPercent: 6.32 },
    { days: 30, total: 1_567, growthPercent: 26.99 },
    { days: 90, total: 2_233, growthPercent: 80.96 },
  ],
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(users: Partial<MonitoringUsers>) {
  act(() => root.render(<UsersCard users={{ ...base, ...users }} />));
}

describe("UsersCard", () => {
  it("mostra o total, as entradas do dia e o crescimento em pt-BR", () => {
    render({});

    expect(container.textContent).toContain(texts.userMetrics.total);
    expect(container.textContent).toContain("1.234");
    expect(container.textContent).toContain(texts.userMetrics.newToday);
    expect(container.textContent).toContain("+0,98%");
  });

  it("desenha uma barra por dia da série", () => {
    render({});

    const barras = container.querySelectorAll("section div[title]");

    expect(barras).toHaveLength(base.series.length);
  });

  it("projeta o total nos três horizontes", () => {
    render({});

    for (const projecao of base.projections) {
      expect(container.textContent).toContain(texts.userMetrics.inDays(projecao.days));
    }
    expect(container.textContent).toContain("2.233");
  });
});
