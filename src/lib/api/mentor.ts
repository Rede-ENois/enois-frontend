import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
import type { CreateTimeSlotInput } from "@/types/application/mentor/create-time-slot-input";
import type { Mentor } from "@/types/application/mentor/mentor";
import type { TimeSlot } from "@/types/application/mentor/time-slot";
import type { UpdateMentorInput } from "@/types/application/mentor/update-mentor-input";
import type { PageResponse } from "@/types/application/pagination/page-response";

import { api, buildQuery } from "../api-client";

export type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
export type { CreateTimeSlotInput } from "@/types/application/mentor/create-time-slot-input";
export type { Mentor } from "@/types/application/mentor/mentor";
export type { TimeSlot } from "@/types/application/mentor/time-slot";
export type { UpdateMentorInput } from "@/types/application/mentor/update-mentor-input";

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
