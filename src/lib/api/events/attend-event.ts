import type { StatusResponse } from "@/types/application/api/status-response";

import { apiRequest } from "@/lib/api-request";

export function attendEvent(eventId: string) {
  return apiRequest<StatusResponse>("POST", `/events/${eventId}/attendees`, undefined, {
    idempotent: true,
  });
}
