import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { BookSessionResponse } from "@/types/application/mentor/book-session-response";
import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
import type { CreateSlotInput } from "@/types/application/mentor/create-slot-input";
import type { Mentor } from "@/types/application/mentor/mentor";
import type { TimeSlot } from "@/types/application/mentor/time-slot";
import type { UpdateMentorInput } from "@/types/application/mentor/update-mentor-input";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const mentorsApi = {
  list: (expertise?: string, cursor?: string | null, limit = 20) => apiRequest<PageResponse<Mentor>>("GET", `/mentors${buildQuery({ expertise, cursor, limit })}`),
  get: (mentorId: string) => apiRequest<Mentor>("GET", `/mentors/${mentorId}`),
  create: (data: CreateMentorInput) => apiRequest<Mentor>("POST", "/mentors", data, { idempotent: true }),
  update: (mentorId: string, data: UpdateMentorInput) => apiRequest<Mentor>("PATCH", `/mentors/${mentorId}`, data, { idempotent: true }),
  remove: (mentorId: string) => apiRequest<StatusResponse>("DELETE", `/mentors/${mentorId}`, null, { idempotent: true }),
  getSlots: (mentorId: string) => apiRequest<TimeSlot[]>("GET", `/mentors/${mentorId}/slots`),
  createSlot: (mentorId: string, data: CreateSlotInput) => apiRequest<TimeSlot>("POST", `/mentors/${mentorId}/slots`, data, { idempotent: true }),
  bookSession: (mentorId: string, slotId: string, message?: string) => apiRequest<BookSessionResponse>("POST", `/mentors/${mentorId}/sessions`, { slotId, message }, { idempotent: true }),
};
