/** Os agregados da janela: campo `null` é medida ausente, que a tela diz como "não medido". */
export type NetworkNodeObservabilitySummary = {
  cpuAvgPercent: number | null;
  cpuMaxPercent: number | null;
  memoryMbLatest: number | null;
  diskFreeMbLatest: number | null;
  runningTasksLatest: number | null;
  sampleCount: number;
};
