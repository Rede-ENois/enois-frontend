import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CalendarAgendaDetailView } from "@/types/application/calendar/calendar-agenda-detail-view";
import type { CalendarParticipation } from "@/types/application/calendar/calendar-participation";
import type {
  CalendarEntryDetailData,
  CalendarEntryDetailParticipant,
  CalendarReminderMinutes,
} from "@rede-enois/design-system/domain";
import {
  CalendarEntryDetail,
  CalendarEntryFormDialog,
  CalendarReminderSelector,
  wallClockOf,
} from "@rede-enois/design-system/domain";
import { Button, EmptyState, LoadingState, useToast } from "@rede-enois/design-system/ui";
import { CalendarX } from "lucide-react";

import { calendarApi } from "@/lib/api";
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
    mutationFn: (input: {
      title: string;
      description: string | null;
      startsAt: string;
      endsAt: string;
      timeZoneId: string;
    }) => calendarApi.update(entryId, input),
    onSuccess: () => {
      setSaveError(null);
      setEditing(false);
      refresh();
    },
    onError: () => setSaveError(texts.agenda.errorSave),
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
        <LoadingState />
      </AppContainer>
    );
  }

  if (detail.isError) {
    return (
      <AppContainer>
        <EmptyState
          icon={CalendarX}
          title={texts.agenda.detailNotFound}
          description={texts.agenda.detailNotFoundHint}
        >
          <Button variant="outline" size="sm" onClick={() => void navigate({ to: "/agenda" })}>
            {texts.agenda.title}
          </Button>
        </EmptyState>
      </AppContainer>
    );
  }

  const view = detailOf(detail.data);
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
        onEdit={() => {
          setSaveError(null);
          setEditing(true);
        }}
        onCancel={() => cancel.mutate()}
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
        savePending={update.isPending}
        saveError={saveError}
        onSave={(values) => {
          setSaveError(null);
          update.mutate({
            title: values.title,
            description: values.description,
            startsAt: values.startsAt,
            endsAt: values.endsAt,
            timeZoneId: values.timeZoneId,
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
