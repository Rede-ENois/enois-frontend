import type { CalendarAgendaDetailView } from "@/types/application/calendar/calendar-agenda-detail-view";
import type { CalendarAgendaItemView } from "@/types/application/calendar/calendar-agenda-item-view";
import type { CalendarEntryView } from "@/types/application/calendar/calendar-entry-view";
import type { CalendarParticipantView } from "@/types/application/calendar/calendar-participant-view";
import type { CalendarParticipation } from "@/types/application/calendar/calendar-participation";
import type { CalendarReminderView } from "@/types/application/calendar/calendar-reminder-view";
import type { CalendarWindowQuery } from "@/types/application/calendar/calendar-window-query";
import type { CreateCalendarEntryInput } from "@/types/application/calendar/create-calendar-entry-input";
import type { UpdateCalendarEntryInput } from "@/types/application/calendar/update-calendar-entry-input";

import { api, buildQuery } from "../api-client";

/**
 * Compromissos do próprio usuário. Toda rota exige sessão: sem ela a resposta é 401, e o id de
 * outra pessoa não se distingue de um que não existe.
 *
 * As escritas passam pelo `api` com `Idempotency-Key` (o cliente já manda em `post`, `patch` e
 * `delete`), então repetir a chamada não cria nem cancela duas vezes.
 */
export const calendarApi = {
  /**
   * Agenda de quem está lendo: o que organiza mais o que foi convidada a participar, cada item com o
   * lugar dela. Sem `from`/`to` o backend recusa com 400.
   *
   * Não existe "só o que eu organizo" no servidor: a resposta traz a agenda inteira e a tela filtra
   * pelo `owner` do item.
   */
  list: ({ from, to, scope }: CalendarWindowQuery) =>
    api.get<CalendarAgendaItemView[]>(
      `/calendar/entries${buildQuery({ from, to, scope: scope ?? undefined })}`,
    ),

  /** Detalhe com o lugar de quem lê. `participants` só vem preenchido para o organizador. */
  get: (entryId: string) => api.get<CalendarAgendaDetailView>(`/calendar/entries/${entryId}`),

  create: (data: CreateCalendarEntryInput) =>
    api.post<CalendarEntryView>("/calendar/entries", data),

  /** Edição parcial: campo ausente não muda; descrição em branco limpa o texto. */
  update: (entryId: string, data: UpdateCalendarEntryInput) =>
    api.patch<CalendarEntryView>(`/calendar/entries/${entryId}`, data),

  /** Cancela, não apaga: o compromisso continua na lista com `state: "CANCELLED"`. */
  cancel: (entryId: string) => api.delete<CalendarEntryView>(`/calendar/entries/${entryId}`),

  /** Convida pelo @. Só o organizador. */
  invite: (entryId: string, username: string) =>
    api.post<CalendarParticipantView>(`/calendar/entries/${entryId}/participants`, { username }),

  participants: (entryId: string) =>
    api.get<CalendarParticipantView[]>(`/calendar/entries/${entryId}/participants`),

  /** Resposta do convidado. Quem responde é tirado da sessão, nunca do caminho. */
  respond: (entryId: string, state: Exclude<CalendarParticipation, "INVITED">) =>
    api.patch<CalendarParticipantView>(`/calendar/entries/${entryId}/participants/me`, { state }),

  removeParticipant: (entryId: string, participantId: string) =>
    api.delete<void>(`/calendar/entries/${entryId}/participants/${participantId}`),

  /** Convites que ainda esperam resposta, para a tela avisar sem varrer a agenda inteira. */
  pendingInvitations: () => api.get<CalendarEntryView[]>("/calendar/invitations"),

  /**
   * Os lembretes que ainda vão tocar para quem lê (o backend não devolve o que já enviou). Só os
   * organizador e participantes existem para o servidor: alheio é 404, como no detalhe.
   */
  listReminders: (entryId: string) =>
    api.get<CalendarReminderView[]>(`/calendar/entries/${entryId}/reminders`),

  /**
   * Põe (ou troca) o lembrete da antecedência escolhida. `PUT` com `minutesBefore` na query, como
   * o backend espera; repetir a mesma antecedência é idempotente no servidor.
   */
  setReminder: (entryId: string, minutesBefore: number) =>
    api.put<CalendarReminderView>(
      `/calendar/entries/${entryId}/reminders${buildQuery({ minutesBefore })}`,
    ),

  /** Tira uma antecedência. Tirar duas vezes não é erro no servidor. */
  clearReminder: (entryId: string, minutesBefore: number) =>
    api.delete<void>(`/calendar/entries/${entryId}/reminders${buildQuery({ minutesBefore })}`),
};
