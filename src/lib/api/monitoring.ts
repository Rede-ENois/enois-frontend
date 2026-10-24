import type { MonitoringEvent } from "@/types/application/monitoring/monitoring-event";
import type { MonitoringOverview } from "@/types/application/monitoring/monitoring-overview";

import { api } from "../api-client";

/** Painel de monitorabilidade (somente admin). */
export const monitoringApi = {
  overview: () => api.get<MonitoringOverview>("/admin/monitoring/overview"),

  events: (params: {
    level?: string;
    type?: string;
    q?: string;
    from?: string;
    to?: string;
    before?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.level) query.set("level", params.level);
    if (params.type) query.set("type", params.type);
    if (params.q) query.set("q", params.q);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.before) query.set("before", params.before);
    query.set("limit", String(params.limit ?? 100));
    return api.get<MonitoringEvent[]>(`/admin/monitoring/events?${query.toString()}`);
  },
};
