import { api, buildQuery } from "../api-client";

export interface Mentor {
  id: string;
  userId: string;
  expertise: string[];
  rating: number;
  sessions: number;
  price: string;
  nextSlot: string;
}

export interface TimeSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
}

export interface CreateMentorInput {
  expertise: string[];
  price: string;
}

export interface UpdateMentorInput {
  expertise?: string[];
  price?: string;
}

export interface CreateTimeSlotInput {
  startsAt: string;
  endsAt: string;
}

export interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export const mentorApi = {
  list: (expertise?: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Mentor>>(`/mentors${buildQuery({ expertise, cursor, limit })}`),

  getById: (mentorId: string) => api.get<Mentor>(`/mentors/${mentorId}`),

  create: (input: CreateMentorInput) => api.post<Mentor>("/mentors", input),

  update: (mentorId: string, input: UpdateMentorInput) =>
    api.patch<Mentor>(`/mentors/${mentorId}`, input),

  remove: (mentorId: string) => api.delete<{ status: string }>(`/mentors/${mentorId}`),

  listTimeSlots: (mentorId: string) => api.get<TimeSlot[]>(`/mentors/${mentorId}/slots`),

  createTimeSlot: (mentorId: string, input: CreateTimeSlotInput) =>
    api.post<TimeSlot>(`/mentors/${mentorId}/slots`, input),

  bookSession: (mentorId: string, timeSlotId: string, message?: string) =>
    api.post<{ status: string; sessionId: string }>(`/mentors/${mentorId}/sessions`, {
      slotId: timeSlotId,
      message,
    }),
};
