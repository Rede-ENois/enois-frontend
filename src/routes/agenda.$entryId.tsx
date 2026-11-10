import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CalendarAgendaDetailView } from "@/types/application/calendar/calendar-agenda-detail-view";
import type { CalendarParticipation } from "@/types/application/calendar/calendar-participation";
import type {
  CalendarEntryDetailData,
  CalendarEntryDetailParticipant,
} from "@rede-enois/design-system/domain";
import {
  CalendarEntryDetail,
  CalendarEntryFormDialog,
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

  const detail = useQuery({
    queryKey: ["agenda", "detalhe", entryId] as const,
    queryFn: () => calendarApi.get(entryId),
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

  return (
    <AppContainer>
      <CalendarEntryDetail
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
