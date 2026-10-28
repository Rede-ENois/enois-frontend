import { useQuery } from "@tanstack/react-query";

import { MySupportRequests as MySupportRequestsView } from "@rede-enois/design-system/domain";

import { supportApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

/**
 * Histórico do solicitante na própria página de suporte: é por aqui que ele vê o pedido
 * concluído (pelo painel ou pela issue do GitHub) sem depender só da notificação.
 */
export function MySupportRequests() {
  const { data, isLoading } = useQuery({
    queryKey: ["support", "mine"],
    queryFn: () => supportApi.mine(20),
  });

  const tickets = (data ?? []).map((ticket) => ({
    ...ticket,
    createdAtLabel: dataHora(ticket.createdAt),
  }));

  return <MySupportRequestsView loading={isLoading} tickets={tickets} />;
}
