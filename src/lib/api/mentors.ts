import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { AvailabilityRule } from "@/types/application/mentor/availability-rule";
import type { BookSessionResponse } from "@/types/application/mentor/book-session-response";
import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
import type { CreateSlotInput } from "@/types/application/mentor/create-slot-input";
import type { MenteeSession } from "@/types/application/mentor/mentee-session";
import type { Mentor } from "@/types/application/mentor/mentor";
import type { MentorRoom } from "@/types/application/mentor/mentor-room";
import type { MySession } from "@/types/application/mentor/my-session";
import type { SessionDialIn } from "@/types/application/mentor/session-dial-in";
import type { TimeSlot } from "@/types/application/mentor/time-slot";
import type { UpdateMentorInput } from "@/types/application/mentor/update-mentor-input";

import { api, buildQuery } from "../api-client";

export const mentorsApi = {
  list: (expertise?: string, cursor?: string | null, limit = 20, query?: string) =>
    api.get<PageResponse<Mentor>>(`/mentors${buildQuery({ expertise, cursor, limit, query })}`),

  get: (mentorId: string) => api.get<Mentor>(`/mentors/${mentorId}`),

  create: (data: CreateMentorInput) => api.post<Mentor>("/mentors", data),

  update: (mentorId: string, data: UpdateMentorInput) =>
    api.patch<Mentor>(`/mentors/${mentorId}`, data),

  remove: (mentorId: string) => api.delete<StatusResponse>(`/mentors/${mentorId}`),

  /** O backend pagina a agenda (PageResponse), não devolve um array solto. */
  getSlots: (mentorId: string) => api.get<PageResponse<TimeSlot>>(`/mentors/${mentorId}/slots`),

  deleteSlot: (mentorId: string, slotId: string) =>
    api.delete<StatusResponse>(`/mentors/${mentorId}/slots/${slotId}`),

  createSlot: (mentorId: string, data: CreateSlotInput) =>
    api.post<TimeSlot>(`/mentors/${mentorId}/slots`, data),

  bookSession: (mentorId: string, slotId: string, message?: string) =>
    api.post<BookSessionResponse>(`/mentors/${mentorId}/sessions`, {
      slotId,
      message,
    }),

  /** Sala configurada pelo mentor (só o dono): link permanente ou sala própria. */
  getRoom: (mentorId: string) => api.get<MentorRoom>(`/mentors/${mentorId}/room`),

  /** Entrar por telefone numa sala Jitsi; a lista vem vazia quando a API do Jitsi não responde. */
  getDialIn: (mentorId: string, sessionId: string) =>
    api.get<SessionDialIn>(`/mentors/${mentorId}/sessions/${sessionId}/dial-in`),

  /** Inscrições recebidas (só o dono da agenda). */
  getSessions: (mentorId: string) => api.get<MenteeSession[]>(`/mentors/${mentorId}/sessions`),

  /** Minhas sessões como mentorado: o que eu agendei e em que pé está. */
  getMySessions: () => api.get<MySession[]>("/mentors/sessions/mine"),

  /** O mentor confirma a sessão: libera o valor retido (menos a taxa) para ele. */
  completeSession: (mentorId: string, sessionId: string) =>
    api.post<StatusResponse>(`/mentors/${mentorId}/sessions/${sessionId}/complete`, {}),

  /** Cancela a sessão: o valor retido volta integral para quem pagou. */
  cancelSession: (mentorId: string, sessionId: string) =>
    api.post<StatusResponse>(`/mentors/${mentorId}/sessions/${sessionId}/cancel`, {}),

  getAvailability: (mentorId: string) =>
    api.get<AvailabilityRule[]>(`/mentors/${mentorId}/availability`),

  saveAvailability: (mentorId: string, items: AvailabilityRule[]) =>
    api.put<AvailabilityRule[]>(`/mentors/${mentorId}/availability`, { items }),
};
