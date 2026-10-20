import type { PushConfig } from "@/types/application/push/push-config";
import type { PushSubscriptionPayload } from "@/types/application/push/push-subscription-payload";

import { api, buildQuery } from "../api-client";

export const pushApi = {
  config: () => api.get<PushConfig>("/push/config"),

  subscribe: (subscription: PushSubscriptionPayload) =>
    api.post<{ id: string }>("/push/subscriptions", subscription),

  unsubscribe: (endpoint: string) =>
    api.delete<void>(`/push/subscriptions${buildQuery({ endpoint })}`),
};
