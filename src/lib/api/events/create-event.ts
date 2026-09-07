import type { CreateEventRequest } from "@/types/application/event/create-event-request";
import type { Event } from "@/types/application/event/event";

import { apiRequest } from "@/lib/api-request";

export function createEvent(data: CreateEventRequest) {
  return apiRequest<Event>("POST", "/events", data, { idempotent: true });
}
