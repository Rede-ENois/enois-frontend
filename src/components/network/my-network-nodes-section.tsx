import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MyNetworkNode } from "@/types/application/network/my-network-node";
import type { MyNetworkNodeData } from "@rede-enois/design-system/domain";
import { MyNetworkNodes as MyNetworkNodesView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, networkParticipantApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

const QUERY_KEY = ["network", "participant", "nodes"];

/** O nó do participante na forma que a view do design system espera (datas já formatadas). */
function nodeView(node: MyNetworkNode): MyNetworkNodeData {
  return {
    id: node.id,
    displayName: node.displayName,
    status: node.status,
    profiles: node.profiles,
    region: node.region,
    country: node.country,
    runtimeVersion: node.runtimeVersion,
    lastSeenAtLabel: node.lastSeenAt ? dataHora(node.lastSeenAt) : null,
    declaredCpuCores: node.declaredCpuCores,
    declaredMemoryMb: node.declaredMemoryMb,
    declaredDiskMb: node.declaredDiskMb,
    declaredBandwidthMbps: node.declaredBandwidthMbps,
    observedCpuPercent: node.observedCpuPercent,
    observedMemoryMb: node.observedMemoryMb,
    observedRunningTasks: node.observedRunningTasks,
    tasksDone: node.tasksDone,
    operable: node.operable,
    quarantineReason: node.quarantineReason,
  };
}

/**
 * Os servidores do participante na página /rede: o que cedeu, o que a rede observou, a
 * contribuição medida e a desconexão voluntária (reversível, mas cai as chaves na hora).
 * `onJoin` abre o diálogo de ingresso, que a página dona da rota controla.
 */
export function MyNetworkNodesSection({ onJoin }: { onJoin?: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => networkParticipantApi.myNodes(),
    retry: false,
  });

  const disconnect = useMutation({
    mutationFn: (nodeId: string) => networkParticipantApi.disconnect(nodeId),
    onSuccess: () => {
      toast(texts.moderator.network.disconnected, "success");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: unknown) =>
      toast(
        error instanceof ApiError ? error.message : texts.moderator.network.actionError,
        "error",
      ),
  });

  return (
    <MyNetworkNodesView
      nodes={(data ?? []).map(nodeView)}
      loading={isLoading}
      error={isError}
      onRefresh={() => void refetch()}
      refreshPending={isRefetching}
      onDisconnect={(nodeId) => disconnect.mutate(nodeId)}
      disconnectPending={disconnect.isPending}
      onJoin={onJoin}
    />
  );
}
