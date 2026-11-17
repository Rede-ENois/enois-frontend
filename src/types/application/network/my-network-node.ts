/** Um nó do participante, como `GET /network/participant/nodes` o devolve — só os dele. */
export type MyNetworkNode = {
  id: string;
  displayName: string;
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "QUARANTINED" | "REVOKED";
  profiles: string[];
  region: string | null;
  country: string | null;
  runtimeVersion: string | null;
  lastSeenAt: string | null;
  declaredCpuCores: number;
  declaredMemoryMb: number;
  declaredDiskMb: number;
  declaredBandwidthMbps: number;
  observedCpuPercent: number | null;
  observedMemoryMb: number | null;
  observedRunningTasks: number | null;
  latencyMs: number | null;
  tasksDone: number;
  operable: boolean;
  quarantineReason: string | null;
};
