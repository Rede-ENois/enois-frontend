import type { MonitoringDailyUsers } from "@/types/application/monitoring/monitoring-daily-users";
import type { MonitoringUsersProjection } from "@/types/application/monitoring/monitoring-users-projection";

/** Contas da comunidade no painel de monitorabilidade: total, série diária e projeções. */
export type MonitoringUsers = {
  generatedAt: string;
  total: number;
  newToday: number;
  newLast7Days: number;
  newLast30Days: number;
  growthTodayPercent: number;
  /** Ritmo diário composto dos últimos 7 dias. */
  growth7DaysPercent: number;
  /** Ritmo diário composto dos últimos 30 dias. */
  growth30DaysPercent: number;
  averageDailyNew7Days: number;
  averageDailyNew30Days: number;
  series: MonitoringDailyUsers[];
  projections: MonitoringUsersProjection[];
};
