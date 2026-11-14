import type { CalendarAgendaDetailView } from "@/types/application/calendar/calendar-agenda-detail-view";
import type { CalendarAgendaItemView } from "@/types/application/calendar/calendar-agenda-item-view";
import type { CalendarAvailabilityWindowView } from "@/types/application/calendar/calendar-availability-window-view";
import type { CalendarConflictQuery } from "@/types/application/calendar/calendar-conflict-query";
import type { CalendarEntryView } from "@/types/application/calendar/calendar-entry-view";
import type { CalendarImportInput } from "@/types/application/calendar/calendar-import-input";
import type { CalendarImportResultView } from "@/types/application/calendar/calendar-import-result-view";
import type { CalendarParticipantView } from "@/types/application/calendar/calendar-participant-view";
import type { CalendarParticipation } from "@/types/application/calendar/calendar-participation";
import type { CalendarReminderView } from "@/types/application/calendar/calendar-reminder-view";
import type { CalendarScope } from "@/types/application/calendar/calendar-scope";
import type { CalendarSubscriptionView } from "@/types/application/calendar/calendar-subscription-view";
import type { CalendarWindowQuery } from "@/types/application/calendar/calendar-window-query";
import type { CalendarAvailabilityWindowInput } from "@/types/application/calendar/create-calendar-availability-window-input";
import type { CreateCalendarEntryInput } from "@/types/application/calendar/create-calendar-entry-input";
import type { RecurringCadence } from "@/types/application/calendar/recurring-cadence";
import type { UpdateCalendarEntryInput } from "@/types/application/calendar/update-calendar-entry-input";

import { api, apiUrl, buildQuery } from "../api-client";

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

  /**
   * Torna o compromisso o começo de uma série: o servidor materializa as próximas datas na hora e
   * o worker mantém 90 dias à frente. Cada ocorrência nasce como compromisso comum — pode ser
   * editada ou cancelada sozinha, e o que já aconteceu fica.
   *
   * Chamar de novo com outra cadência troca a da série. Compromisso com origem é recusado (409):
   * quem repete o fato é o módulo que o criou.
   */
  startSeries: (entryId: string, recurrence: RecurringCadence) =>
    api.post<CalendarEntryView>(`/calendar/entries/${entryId}/series`, { recurrence }),

  /**
   * Encerra a série a partir desta ocorrência: as futuras são canceladas, o passado fica e ela
   * volta a ser um compromisso único. Encerrar o que não é série devolve o compromisso como está.
   */
  stopSeries: (entryId: string) =>
    api.delete<CalendarEntryView>(`/calendar/entries/${entryId}/series`),

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

  /**
   * O que já ocupa o intervalo proposto para quem lê. É consulta, não bloqueio: a agenda permite
   * sobreposição de propósito, e o formulário usa a lista para avisar antes de salvar.
   *
   * `entryId` mantém a própria entrada de fora na edição.
   */
  conflicts: ({ from, to, scope, entryId }: CalendarConflictQuery) =>
    api.get<CalendarAgendaItemView[]>(
      `/calendar/entries/conflicts${buildQuery({
        from,
        to,
        scope: scope ?? undefined,
        entryId: entryId ?? undefined,
      })}`,
    ),

  /**
   * A semana de disponibilidade de quem está lendo, ordenada por dia e começo. Não há rota para a
   * agenda de outra pessoa: o servidor tira a pessoa da sessão.
   */
  availability: () => api.get<CalendarAvailabilityWindowView[]>("/calendar/availability"),

  /**
   * Substitui a semana inteira, não uma janela: o corpo é o conjunto que a pessoa quer e o que não
   * vier deixa de existir. É `PUT` de representação, então repetir a mesma semana não duplica nada.
   */
  setAvailability: (windows: CalendarAvailabilityWindowInput[]) =>
    api.put<CalendarAvailabilityWindowView[]>("/calendar/availability", { windows }),

  /**
   * Endereço do `.ics` da janela mostrada. O download não passa pelo cliente `api` porque a
   * resposta é arquivo, não JSON: quem baixa é o navegador, com sessão de cookie.
   */
  exportUrl: ({ from, to, scope }: CalendarWindowQuery) =>
    apiUrl(`/calendar/entries/export.ics${buildQuery({ from, to, scope: scope ?? undefined })}`),

  /**
   * A assinatura privada `.ics` de quem está lendo, ou `null` quando ainda não existe (o servidor
   * responde 204). O token não volta aqui: só na resposta que o criou.
   */
  subscription: async () =>
    (await api.get<CalendarSubscriptionView | undefined>("/calendar/subscription")) ?? null,

  /**
   * Cria a assinatura, ou devolve a existente. Só a criação traz `token`; quem já tinha uma recebe
   * `token: null` e o link antigo continua valendo.
   */
  createSubscription: (scope: CalendarScope | null) =>
    api.post<CalendarSubscriptionView>(
      `/calendar/subscription${buildQuery({ scope: scope ?? undefined })}`,
    ),

  /** Troca o token: o link anterior deixa de valer no mesmo instante. */
  regenerateSubscription: () =>
    api.post<CalendarSubscriptionView>("/calendar/subscription/regenerate"),

  /** Revoga a assinatura ativa; a próxima leitura pelo link responde 404. */
  revokeSubscription: () => api.delete<void>("/calendar/subscription"),

  /**
   * O endereço que a pessoa cola no calendário externo. Não passa pelo cliente `api`: quem busca é
   * o leitor externo, sem sessão, e o token no caminho é a credencial inteira.
   */
  subscriptionUrl: (token: string) => apiUrl(`/calendar/subscribe/${token}.ics`),

  /**
   * Importa um `.ics` como multipart (fase 8, D23). É escrita, então o `Idempotency-Key` automático
   * do `api.post` protege contra o clique duplo duplicar a agenda; reimportar o mesmo arquivo é
   * idempotente no servidor por UID. O `scope` vai na query, como a criação.
   */
  importIcs: ({ file, scope }: CalendarImportInput) => {
    const body = new FormData();
    body.append("file", file);
    return api.post<CalendarImportResultView>(
      `/calendar/entries/import${buildQuery({ scope: scope ?? undefined })}`,
      body,
    );
  },
};
