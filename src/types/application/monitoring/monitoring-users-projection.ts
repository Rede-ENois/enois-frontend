/** Projeção do total de contas daqui a N dias, no ritmo da última semana. */
export type MonitoringUsersProjection = {
  days: number;
  total: number;
  growthPercent: number;
};
