import type { NetworkNodeStatus } from "./network-node-status";

/** Um nó da rede cooperativa, como `GET /admin/network/nodes` o devolve. */
export type NetworkNode = {
  id: string;
  displayName: string;
  ownerUserId: string;
  status: NetworkNodeStatus;
  profiles: string[];
  region: string | null;
  runtimeVersion: string | null;
  lastSeenAt: string | null;
  operable: boolean;
  /** Id da chave vigente; `null` quando o nó ainda não tem chave. */
  keyId: string | null;
  /** Prefixo da chave vigente, para reconhecê-la sem revelar nada. */
  keyPrefix: string | null;
  /** A chave vigente já autenticou alguma requisição do nó. */
  keyUsed: boolean;
  /** Saúde medida, que não é `status`: um nó ACTIVE pode estar fora do balanceamento. */
  degraded: boolean;
  /** Latência do último heartbeat, em ms; `null` quando o nó nunca reportou. */
  latencyMs: number | null;
  /** Falhas consecutivas na linha da tarefa; 0 é saudável. */
  failureStreak: number;
  /** Motivo da quarentena vigente; `null` fora dela. */
  quarantineReason: string | null;
};
