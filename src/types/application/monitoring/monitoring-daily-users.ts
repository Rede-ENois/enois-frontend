/** Um dia da série de contas: quantas entraram, o total acumulado e a variação sobre a base. */
export type MonitoringDailyUsers = {
  /** Dia no fuso de São Paulo (YYYY-MM-DD). */
  date: string;
  newUsers: number;
  /** Total de contas ao fim do dia. */
  total: number;
  growthPercent: number;
};
