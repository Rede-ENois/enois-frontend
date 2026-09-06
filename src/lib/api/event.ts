import { api, buildQuery } from "../api-client";

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  format: "ONLINE" | "IN_PERSON" | "HYBRID";
  host: string;
  attendees: number;
  cover: string | null;
}

export interface CreateEventInput {
  title: string;
  date: string;
  time: string;
  format: string;
  host: string;
  cover?: string | null;
}

export interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export const eventApi = {
  list: (format?: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Event>>(`/events${buildQuery({ format, cursor, limit })}`),

  getById: (eventId: string) => api.get<Event>(`/events/${eventId}`),

  create: (input: CreateEventInput) => api.post<Event>("/events", input),

  attend: (eventId: string) => api.post<{ status: string }>(`/events/${eventId}/attendees`),

  cancelAttendance: (eventId: string) =>
    api.delete<{ status: string }>(`/events/${eventId}/attendees`),
};
