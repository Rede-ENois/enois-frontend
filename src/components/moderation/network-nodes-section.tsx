import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { IssuedNodeKey } from "@/types/application/network/issued-node-key";
import type { NetworkNode } from "@/types/application/network/network-node";
import type { NetworkNodeData } from "@rede-enois/design-system/domain";
import { NetworkNodesSection as NetworkNodesSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, adminNetworkApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

const QUERY_KEY = ["admin", "network", "nodes"];

/** O nó do backend na forma que a visão do design system espera (data já formatada). */
function nodeView(node: NetworkNode): NetworkNodeData {
  return {
    id: node.id,
    displayName: node.displayName,
    ownerUserId: node.ownerUserId,
    status: node.status,
    profiles: node.profiles,
    region: node.region,
    runtimeVersion: node.runtimeVersion,
    lastSeenAtLabel: node.lastSeenAt ? dataHora(node.lastSeenAt) : null,
    keyPrefix: node.keyPrefix,
    keyUsed: node.keyUsed,
    operable: node.operable,
    degraded: node.degraded,
    latencyMs: node.latencyMs,
    failureStreak: node.failureStreak,
    quarantineReason: node.quarantineReason,
  };
}

/**
 * Administração da rede cooperativa: os nós e a chave de API de cada um.
 *
 * <p>A chave em claro só existe no retorno da emissão, e a tela a mostra uma vez. Fechar sem copiar
 * não é um beco sem saída: gerar outra revoga a anterior, e o aviso diz isso antes de fechar.</p>
 */
export function NetworkNodesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [issuedKey, setIssuedKey] = useState<(IssuedNodeKey & { nodeId: string }) | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminNetworkApi.nodes(),
    retry: false,
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const onError = (error: unknown) =>
    toast(error instanceof ApiError ? error.message : texts.moderator.network.actionError, "error");

  const issueKey = useMutation({
    mutationFn: (nodeId: string) => adminNetworkApi.issueKey(nodeId),
    onSuccess: (key, nodeId) => {
      setIssuedKey({ ...key, nodeId });
      toast(texts.moderator.network.keyIssued, "success");
      refresh();
    },
    onError,
  });

  const revokeKey = useMutation({
    mutationFn: (nodeId: string) => {
      const node = data?.find((item) => item.id === nodeId);
      if (!node?.keyId) {
        // Sem chave vigente não há o que revogar; falhar aqui é melhor que mandar id vazio.
        return Promise.reject(new Error(texts.moderator.network.actionError));
      }
      return adminNetworkApi.revokeKey(nodeId, node.keyId);
    },
    onSuccess: () => {
      toast(texts.moderator.network.keyRevoked, "success");
      refresh();
    },
    onError,
  });

  const approve = useMutation({
    mutationFn: (nodeId: string) => adminNetworkApi.approve(nodeId),
    onSuccess: () => {
      toast(texts.moderator.network.approved, "success");
      refresh();
    },
    onError,
  });

  const changeStatus = useMutation({
    mutationFn: ({
      nodeId,
      status,
    }: {
      nodeId: string;
      status: "SUSPENDED" | "QUARANTINED" | "REVOKED";
    }) => adminNetworkApi.changeStatus(nodeId, status),
    onSuccess: () => {
      toast(texts.moderator.network.statusChanged, "success");
      refresh();
    },
    onError,
  });

  return (
    <NetworkNodesSectionView
      nodes={(data ?? []).map(nodeView)}
      loading={isLoading}
      error={isError}
      onRefresh={() => void refetch()}
      refreshPending={isRefetching}
      onIssueKey={(nodeId) => issueKey.mutate(nodeId)}
      issueKeyPending={issueKey.isPending}
      onRevokeKey={(nodeId) => revokeKey.mutate(nodeId)}
      revokeKeyPending={revokeKey.isPending}
      onApprove={(nodeId) => approve.mutate(nodeId)}
      approvePending={approve.isPending}
      onChangeStatus={(nodeId, status) => changeStatus.mutate({ nodeId, status })}
      statusPending={changeStatus.isPending}
      issuedKey={issuedKey}
      onDismissIssuedKey={() => setIssuedKey(null)}
    />
  );
}
