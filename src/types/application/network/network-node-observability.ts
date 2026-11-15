import type { NetworkNodeObservabilityLevelCount } from "@/types/application/network/network-node-observability-level-count";
import type { NetworkNodeObservabilityLine } from "@/types/application/network/network-node-observability-line";
import type { NetworkNodeObservabilitySample } from "@/types/application/network/network-node-observability-sample";
import type { NetworkNodeObservabilitySummary } from "@/types/application/network/network-node-observability-summary";

/**
 * O quadro ao vivo de UM nó, como `GET /admin/network/nodes/{id}/observability` o devolve.
 *
 * <p>É a janela que o nó EMPURRA no heartbeat (ele não abre porta), guardada curta no Control
 * Plane: não é histórico nem auditoria.</p>
 */
export type NetworkNodeObservability = {
  nodeId: string;
  generatedAt: string;
  series: NetworkNodeObservabilitySample[];
  console: NetworkNodeObservabilityLine[];
  summary: NetworkNodeObservabilitySummary;
  consoleLevels: NetworkNodeObservabilityLevelCount;
};
