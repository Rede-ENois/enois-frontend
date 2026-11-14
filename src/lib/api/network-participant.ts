import type { MyNetworkNode } from "@/types/application/network/my-network-node";
import type { NetworkJoinToken } from "@/types/application/network/network-join-token";

import { api } from "../api-client";

/**
 * A interface do participante da rede: os próprios servidores, a contribuição medida e o
 * ingresso. O backend devolve só nós do dono da sessão — nunca os de outro participante.
 */
export const networkParticipantApi = {
  myNodes: () => api.get<MyNetworkNode[]>("/network/participant/nodes"),

  /** Desconexão voluntária: suspende o nó e revoga as chaves dele na mesma transação. */
  disconnect: (nodeId: string) =>
    api.post<MyNetworkNode>(`/network/participant/nodes/${encodeURIComponent(nodeId)}/disconnect`),

  /** Solicitação de ingresso: token de uso único e curto, para levar ao instalador. */
  requestJoin: (displayName: string) =>
    api.post<NetworkJoinToken>("/network/participant/join", { displayName }),
};
