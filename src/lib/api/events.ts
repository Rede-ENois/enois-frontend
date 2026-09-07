import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";
import type { Event } from "@/types/application/event/event";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const eventsApi = {
  list: (format?: string, cursor?: string | null, limit = 20) => apiRequest<PageResponse<Event>>("GET", `/events${buildQuery({ format, cursor, limit })}`),
  get: (eventId: string) => apiRequest<Event>("GET", `/events/${eventId}`),
  create: (data: CreateEventRequest) => apiRequest<Event>("POST", "/events", data, { idempotent: true }),
  attend: (eventId: string) => apiRequest<StatusResponse>("POST", `/events/${eventId}/attendees`, undefined, { idempotent: true }),
  cancelAttendance: (eventId: string) => apiRequest<StatusResponse>("DELETE", `/events/${eventId}/attendees`, null, { idempotent: true }),
};
