import type { CreateEventInput } from "@/types/application/event/create-event-input";
import type { Event } from "@/types/application/event/event";
import type { PageResponse } from "@/types/application/pagination/page-response";

import { api, buildQuery } from "../api-client";

export type { CreateEventInput } from "@/types/application/event/create-event-input";
export type { Event } from "@/types/application/event/event";

export const eventApi = {
  list: (format?: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Event>>(`/events${buildQuery({ format, cursor, limit })}`),

  getById: (eventId: string) => api.get<Event>(`/events/${eventId}`),

  create: (input: CreateEventInput) => api.post<Event>("/events", input),

  attend: (eventId: string) => api.post<{ status: string }>(`/events/${eventId}/attendees`),

  cancelAttendance: (eventId: string) =>
    api.delete<{ status: string }>(`/events/${eventId}/attendees`),
};
