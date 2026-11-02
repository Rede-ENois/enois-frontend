import type { PresenceStatus } from "@/types/application/presence/presence-status";
import type { PublicPresenceStatus } from "@/types/application/presence/public-presence-status";

import { api } from "../api-client";

export const presenceApi = {
  own: () => api.get<{ status: PresenceStatus }>("/me/presence"),
  set: (status: PresenceStatus) => api.put<{ status: PresenceStatus }>("/me/presence", { status }),
  heartbeat: () => api.post<void>("/me/presence/heartbeat", {}),
  byUsername: (username: string) =>
    api.get<{ status: PublicPresenceStatus }>(`/users/${encodeURIComponent(username)}/presence`),
};
