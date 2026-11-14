import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CalendarAgendaDetailView } from "@/types/application/calendar/calendar-agenda-detail-view";
import type { CalendarParticipation } from "@/types/application/calendar/calendar-participation";
import type { UpdateCalendarEntryInput } from "@/types/application/calendar/update-calendar-entry-input";
import type {
  CalendarEntryDetailData,
  CalendarEntryDetailParticipant,
  CalendarEntryFormValues,
  CalendarReminderMinutes,
} from "@rede-enois/design-system/domain";
import {
  CalendarEntryDetail,
  CalendarEntryFormDialog,
  CalendarReminderSelector,
  wallClockOf,
} from "@rede-enois/design-system/domain";
import { Button, EmptyState, LoadingState, useToast } from "@rede-enois/design-system/ui";
import { CalendarX, TriangleAlert } from "lucide-react";

import { ApiError, calendarApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

/**
 * Um compromisso da agenda, aberto. O servidor devolve o compromisso com o lugar de quem lê e —
 * só para o organizador — a lista de convidados; quem foi convidado recebe `participants: null`,
 * e é exatamente isso que o componente desenha.
 *
 * Toda ação volta para cá: o detalhe recarrega, então "aceitei", "convidei" e "cancelei" aparecem
 * no que está na tela, não numa tela de trás.
 */
export const Route = createFileRoute("/agenda/$entryId")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.agenda.seoTitle }] }),
  component: EntryDetailPage,
});

function EntryDetailPage() {
  const { entryId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ["agenda", "detalhe", entryId] as const,
    queryFn: () => calendarApi.get(entryId),
  });

  const reminders = useQuery({
    queryKey: ["agenda", "lembretes", entryId] as const,
    queryFn: () => calendarApi.listReminders(entryId),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["agenda"] });
  };

  const update = useMutation({
    mutationFn: (input: UpdateCalendarEntryInput) => calendarApi.update(entryId, input),
    onSuccess: () => {
      setSaveError(null);
      setEditing(false);
      refresh();
    },
    onError: () => setSaveError(texts.agenda.errorSave),
  });

  /**
   * A cadência não é campo do `PATCH`: o compromisso é editado primeiro e a série vem depois, numa
   * segunda chamada. "Não repetir" numa série existente encerra a série (as futuras são canceladas
   * e o passado fica); as outras cadências iniciam ou trocam a dela.
   */
  const changeSeries = useMutation({
    mutationFn: (recurrence: CalendarEntryFormValues["recurrence"]) =>
      recurrence === "NONE"
        ? calendarApi.stopSeries(entryId)
        : calendarApi.startSeries(entryId, recurrence),
    onSuccess: (_entry, recurrence) => {
      setSaveError(null);
      setEditing(false);
      toast(
        recurrence === "NONE" ? texts.agenda.seriesStopped : texts.agenda.seriesStarted,
        "success",
      );
      refresh();
    },
    onError: () => setSaveError(texts.agenda.seriesError),
  });

  const cancel = useMutation({
    mutationFn: () => calendarApi.cancel(entryId),
    onSuccess: refresh,
    onError: () => toast(texts.agenda.errorCancel, "error"),
  });

  const respond = useMutation({
    mutationFn: (answer: "ACCEPTED" | "DECLINED" | "TENTATIVE") =>
      calendarApi.respond(entryId, answer),
    onMutate: () => setRespondingId(true),
    onSuccess: refresh,
    onError: () => toast(texts.agenda.errorRespond, "error"),
    onSettled: () => setRespondingId(false),
  });

  const invite = useMutation({
    mutationFn: (username: string) => calendarApi.invite(entryId, username),
    onSuccess: () => {
      setInviteError(null);
      refresh();
    },
    onError: () => setInviteError(texts.agenda.errorInvite),
  });

  const removeParticipant = useMutation({
    mutationFn: (participantId: string) => calendarApi.removeParticipant(entryId, participantId),
    onSuccess: refresh,
    onError: () => toast(texts.agenda.errorInvite, "error"),
  });

  const setReminder = useMutation({
    mutationFn: async (minutes: CalendarReminderMinutes | null) => {
      for (const change of reminderChanges(reminders.data ?? [], minutes)) {
        if (change.clear !== undefined) {
          await calendarApi.clearReminder(entryId, change.clear);
        }
        if (change.set !== undefined) {
          await calendarApi.setReminder(entryId, change.set);
        }
      }
    },
    onSuccess: () => {
      setReminderError(null);
      void queryClient.invalidateQueries({ queryKey: ["agenda", "lembretes", entryId] });
    },
    onError: () => setReminderError(texts.agenda.errorReminder),
  });

  if (detail.isPending) {
    return (
      <AppContainer>
        <LoadingState label={texts.common.loading} />
      </AppContainer>
    );
  }

  if (detail.isError) {
    const missing = detailMissing(detail.error);
    return (
      <AppContainer>
        <EmptyState
          icon={missing ? CalendarX : TriangleAlert}
          title={missing ? texts.agenda.detailNotFound : texts.agenda.errorLoad}
          description={missing ? texts.agenda.detailNotFoundHint : texts.agenda.errorLoadHint}
        >
          {!missing && (
            <Button variant="outline" size="sm" onClick={() => void detail.refetch()}>
              {texts.agenda.retry}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => void navigate({ to: "/agenda" })}>
            {texts.agenda.title}
          </Button>
        </EmptyState>
      </AppContainer>
    );
  }

  const view = detailOf(detail.data);
  // Compromisso criado por outro módulo (mentoria, evento, entrevista) é somente leitura aqui: quem
  // muda o fato é o módulo dono, e editar pela agenda deixaria os dois contando histórias
  // diferentes. O servidor recusa a escrita; a tela nem oferece o botão.
  const sourceOwned = isSourceOwned(detail.data.entry);
  // O servidor devolve o que ainda vai tocar; a tela mostra a escolha única, então a primeira
  // antecedência é a que está ligada. Sem lembrete, o seletor abre em "não avisar".
  const chosenReminder = (reminders.data?.[0]?.minutesBefore ??
    null) as CalendarReminderMinutes | null;

  return (
    <AppContainer>
      <CalendarEntryDetail
        reminder={
          <CalendarReminderSelector
            value={chosenReminder}
            onChange={(minutes) => setReminder.mutate(minutes)}
            saving={setReminder.isPending}
            error={reminderError}
          />
        }
        entry={view.entry}
        owner={view.owner}
        participation={view.participation}
        participants={view.participants}
        backLabel={texts.agenda.title}
        onBack={() => void navigate({ to: "/agenda" })}
        onEdit={
          sourceOwned
            ? undefined
            : () => {
                setSaveError(null);
                setEditing(true);
              }
        }
        onCancel={sourceOwned ? undefined : () => cancel.mutate()}
        onRespond={(answer) => respond.mutate(answer)}
        onRemoveParticipant={(participantId) => removeParticipant.mutate(participantId)}
        onInvite={async (username) => {
          await invite.mutateAsync(username);
          return true;
        }}
        saving={cancel.isPending || update.isPending}
        responding={respondingId}
        invitePending={invite.isPending}
        error={saveError}
        inviteError={inviteError}
      />
      <CalendarEntryFormDialog
        open={editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(false);
            setSaveError(null);
          }
        }}
        entry={view.formEntry}
        timeZoneId={view.entry.timeZoneId}
        savePending={update.isPending || changeSeries.isPending}
        saveError={saveError}
        onSave={(values) => {
          setSaveError(null);
          const current = detail.data.entry.recurrence ?? "NONE";
          update.mutate(updateInputOf(values), {
            onSuccess: () => {
              if (values.recurrence === current) return;
              changeSeries.mutate(values.recurrence);
            },
          });
        }}
      />
    </AppContainer>
  );
}

/**
 * O seletor escolhe **um** aviso, mas o servidor guarda um por antecedência. Trocar de opção apaga
 * as outras antes de gravar a nova: deixar duas ligadas faria a pessoa ser avisada duas vezes por
 * uma escolha só. "Não avisar" (`null`) apaga todas. A lista de mudanças é pura para o teste
 * prender a regra sem montar a tela.
 */
export function reminderChanges(
  current: { minutesBefore: number }[],
  chosen: CalendarReminderMinutes | null,
): { clear?: number; set?: CalendarReminderMinutes }[] {
  const changes: { clear?: number; set?: CalendarReminderMinutes }[] = [];
  for (const reminder of current) {
    if (reminder.minutesBefore !== chosen) {
      changes.push({ clear: reminder.minutesBefore });
    }
  }
  if (chosen !== null && !current.some((reminder) => reminder.minutesBefore === chosen)) {
    changes.push({ set: chosen });
  }
  return changes;
}

/**
 * O 404 é o único "não existe": a API responde isso quando o compromisso foi cancelado ou o id
 * não é daquela pessoa. Falha de rede e servidor fora do ar também caem em `isError`, e dizer
 * "não encontrado" ali manda a pessoa procurar um problema que não é dela.
 */
export function detailMissing(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * O compromisso veio de outro módulo? A origem é o que decide se a agenda pode editá-lo: entrada
 * com `sourceType` pertence ao módulo que a criou (mentoria, evento, entrevista) e só ele muda o
 * fato. A tela usa isto para não oferecer editar/cancelar; o servidor recusa de qualquer forma.
 */
export function isSourceOwned(entry: { sourceType: string | null }): boolean {
  return entry.sourceType !== null;
}

/**
 * O que o formulário devolve vira o corpo do `PATCH`. Os três campos de classificação vão junto
 * porque o formulário os mostra: mandar só título e horário fazia a pessoa trocar "Social" por
 * "Profissional" e salvar sem que nada mudasse.
 */
export function updateInputOf(values: CalendarEntryFormValues): UpdateCalendarEntryInput {
  return {
    scope: values.scope,
    kind: values.kind,
    title: values.title,
    description: values.description,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
    timeZoneId: values.timeZoneId,
    allDay: values.allDay,
  };
}

/**
 * O que o servidor devolve virou o que o componente desenha. O horário nasce aqui, uma vez, no
 * fuso que o próprio compromisso declara — "19h" continua 19h para quem abriu de outro lugar.
 */
export function detailOf(data: CalendarAgendaDetailView) {
  const entry = data.entry;
  const start = wallClockOf(entry.startsAt, entry.timeZoneId);
  const end = wallClockOf(entry.endsAt, entry.timeZoneId);
  const detail: CalendarEntryDetailData = {
    id: entry.id,
    scope: entry.scope,
    kind: entry.kind,
    title: entry.title,
    description: entry.description,
    day: start.day,
    start: entry.allDay ? null : start.time,
    end: entry.allDay ? null : end.time,
    timeZoneId: entry.timeZoneId,
    allDay: entry.allDay,
    cancelledAt: entry.cancelledAt,
  };
  const participants: CalendarEntryDetailParticipant[] | null = data.participants
    ? data.participants.map((participant) => ({
        id: participant.id,
        username: participant.username,
        state: participant.state,
      }))
    : null;
  // O formulário de edição fala em instante + fuso; o `CalendarEntryData` que ele entende é o que a
  // própria resposta da API já é.
  return {
    entry: detail,
    owner: data.owner,
    participation: data.participation as CalendarParticipation | null,
    participants,
    formEntry: entry,
  };
}
