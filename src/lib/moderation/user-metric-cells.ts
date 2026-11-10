import { texts } from "@/texts";
import type { MonitoringUsers } from "@/types/application/monitoring/monitoring-users";

const numero = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor);

const percentual = (valor: number) =>
  `${valor > 0 ? "+" : ""}${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}%`;

/** Os mesmos formatadores para os números de fora das células (as projeções). */
export const metricFormat = { numero, percentual };

/**
 * Os nove números do cartão de contas, na ordem em que são lidos: total, uso real nas últimas 24h
 * e os recortes de entrada/crescimento. Fica fora do componente para o cartão só desenhar o que
 * este módulo monta — e para a conta ser testável sem o design system.
 */
export function userMetricCells(users: MonitoringUsers): [string, string][] {
  return [
    [texts.userMetrics.total, numero(users.total)],
    // Uso real nas últimas 24h, logo depois do total: "quantas pessoas entraram" diz mais sobre a
    // saúde do produto do que "quantas contas existem".
    [texts.userMetrics.active24h, numero(users.activeLast24Hours)],
    [texts.userMetrics.newToday, numero(users.newToday)],
    [texts.userMetrics.new7, numero(users.newLast7Days)],
    [texts.userMetrics.new30, numero(users.newLast30Days)],
    [texts.userMetrics.growthToday, percentual(users.growthTodayPercent)],
    [texts.userMetrics.growth7, percentual(users.growth7DaysPercent)],
    [texts.userMetrics.growth30, percentual(users.growth30DaysPercent)],
    [texts.userMetrics.average7, numero(users.averageDailyNew7Days)],
    [texts.userMetrics.average30, numero(users.averageDailyNew30Days)],
  ];
}
