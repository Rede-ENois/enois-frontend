/**
 * O resumo da rede como `GET /admin/network/nodes/dashboard` o devolve — a fotografia do momento
 * da consulta. Médias vêm com a contagem de amostras ao lado; média sem amostra é `null`.
 */
export type NetworkDashboard = {
  total: number;
  active: number;
  unavailable: number;
  quarantined: number;
  alive: number;
  degraded: number;
  declaredCpuCores: number;
  declaredMemoryMb: number;
  freeSlots: number;
  avgCpuPercent: number | null;
  cpuSamples: number;
  avgMemoryMb: number | null;
  memorySamples: number;
  byRegion: Record<string, number>;
  byProfile: Record<string, number>;
  runtimeVersions: Record<string, number>;
};
