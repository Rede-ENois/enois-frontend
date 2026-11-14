import type { IssuedNodeKey } from "@/types/application/network/issued-node-key";
import type { NetworkApiRequest } from "@/types/application/network/network-api-request";
import type { NetworkAuditRecord } from "@/types/application/network/network-audit-record";
import type { NetworkDashboard } from "@/types/application/network/network-dashboard";
import type { NetworkNode } from "@/types/application/network/network-node";
import type { NetworkNodeStatus } from "@/types/application/network/network-node-status";

import { api } from "../api-client";

/**
 * Administração da rede cooperativa. Tudo aqui é exclusivo do admin (o backend trava a rota).
 *
 * <p>A API key de um nó é gerada por aqui: uma chave por nó, exibida uma única vez e guardada só
 * como hash no servidor. Gerar de novo revoga a anterior, e revogar o nó revoga a chave dele.</p>
 */
export const adminNetworkApi = {
  nodes: () => api.get<NetworkNode[]>("/admin/network/nodes"),

  /** A fotografia da rede: contagens, capacidade somada e versões em campo. */
  dashboard: () => api.get<NetworkDashboard>("/admin/network/nodes/dashboard"),

  node: (nodeId: string) =>
    api.get<NetworkNode>(`/admin/network/nodes/${encodeURIComponent(nodeId)}`),

  /** Token de provisionamento de uso único: cria o nó, não o opera. */
  provisionToken: (data: { displayName: string; ownerUserId: string; profiles: string[] }) =>
    api.post<{ token: string; expiresAt: string }>("/admin/network/nodes/provision-token", data),

  /** Gera a API key do nó. A resposta é a única vez em que a chave aparece em claro. */
  issueKey: (nodeId: string) =>
    api.post<IssuedNodeKey>(`/admin/network/nodes/${encodeURIComponent(nodeId)}/keys`),

  /** Revoga a chave vigente do nó, sem mexer no estado do nó. */
  revokeKey: (nodeId: string, keyId: string) =>
    api.post<NetworkNode>(
      `/admin/network/nodes/${encodeURIComponent(nodeId)}/keys/${encodeURIComponent(keyId)}/revoke`,
    ),

  approve: (nodeId: string) =>
    api.post<NetworkNode>(`/admin/network/nodes/${encodeURIComponent(nodeId)}/approve`),

  /** Suspende, põe em quarentena ou revoga. REVOKED é terminal. */
  changeStatus: (nodeId: string, status: NetworkNodeStatus) =>
    api.post<NetworkNode>(`/admin/network/nodes/${encodeURIComponent(nodeId)}/status`, { status }),

  /** Redefine o que o participante cede (campo ausente = mantém o vigente). */
  capacity: (
    nodeId: string,
    data: { cpuCores?: number; memoryMb?: number; diskMb?: number; bandwidthMbps?: number },
  ) => api.post<NetworkNode>(`/admin/network/nodes/${encodeURIComponent(nodeId)}/capacity`, data),

  /** Redefine os perfis autorizados (lista vazia = nó sem tarefa). */
  profiles: (nodeId: string, profiles: string[]) =>
    api.post<NetworkNode>(`/admin/network/nodes/${encodeURIComponent(nodeId)}/profiles`, {
      profiles,
    }),

  /**
   * As rotas que a rede oferece — a mesma lista assinada que o nó recebe. O admin escolhe pelo
   * nome: o destino (URL) vive só na config assinada, e nunca sai daqui.
   */
  apiRoutes: () => api.get<string[]>("/admin/network/api-routes"),

  /** Pede a rota (pelo nome) neste nó. O pedido leva alvo: é este nó que executa. */
  apiRequest: (nodeId: string, route: string) =>
    api.post<NetworkApiRequest>(
      `/admin/network/nodes/${encodeURIComponent(nodeId)}/api-request?route=${encodeURIComponent(route)}`,
    ),

  /** As requisições em aberto do nó — o que está na fila ou executando. */
  openApiRequests: (nodeId: string) =>
    api.get<NetworkApiRequest[]>(`/admin/network/nodes/${encodeURIComponent(nodeId)}/api-request`),

  /** O histórico administrativo do nó — a trilha de auditoria lida de volta, mais nova primeiro. */
  history: (nodeId: string, limit = 50) =>
    api.get<NetworkAuditRecord[]>(
      `/admin/network/nodes/${encodeURIComponent(nodeId)}/history?limit=${limit}`,
    ),
};
