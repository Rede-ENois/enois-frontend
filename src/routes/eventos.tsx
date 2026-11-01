import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { PageResponse } from "@/types/application/api/page-response";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";
import type { Event } from "@/types/application/event/event";
import type { EventRecurrence } from "@/types/application/event/event-recurrence";
import type { EventFormProps } from "@/types/routes/events/event-form-props";
import type { EventListsSnapshot } from "@/types/routes/events/event-lists-snapshot";
import type { FieldProps } from "@/types/routes/events/field-props";
import {
  EventCard,
  EventRecurrenceControl,
  EventRecurrenceField,
  EventRitualsFilter,
} from "@rede-enois/design-system/domain";
import { CityStateField, formatLocation } from "@rede-enois/design-system/patterns";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Input,
  Label,
  LoadingState,
  PageHeader,
  useToast,
} from "@rede-enois/design-system/ui";
import { Calendar, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";

import { eventsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { resolveCdnUrl } from "@/lib/api/media";
import { requireAuth } from "@/lib/require-auth";
import { cityStateErrorCode, useCityState } from "@/lib/use-city-state";
import { useMediaUpload } from "@/lib/use-media-upload";

import { AppContainer } from "@/components/app-container";
import { ErrorBanner } from "@/components/error-banner";

/** How long a deep-linked event (`?evento=id`) keeps its highlight ring. */
const HIGHLIGHT_MS = 4000;

/** Applies `update` to the event in every cached events list (all and rituals). */
function patchEventInLists(queryClient: QueryClient, eventId: string, update: (e: Event) => Event) {
  queryClient.setQueriesData<PageResponse<Event>>({ queryKey: ["events"] }, (page) =>
    page && Array.isArray(page.items)
      ? { ...page, items: page.items.map((e) => (e.id === eventId ? update(e) : e)) }
      : page,
  );
}

function withAttendance(event: Event, attending: boolean): Event {
  if (event.attending === attending) return event;
  const attendees = Math.max(0, (event.attendees ?? 0) + (attending ? 1 : -1));
  return { ...event, attending, attendees };
}

/**
 * The card has one place line: the free-text location plus the structured "Cidade, UF" when the
 * event has one (the DS card does not read city/state on its own).
 */
function withPlace(event: Event): Event {
  const place = [event.location, formatLocation(event.city, event.state)].filter(Boolean);
  return place.length > 0 ? { ...event, location: place.join(" · ") } : event;
}

function recurrenceErrorMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.code : undefined;
  if (code === "NOT_EVENT_OWNER") return texts.events.recurrence.notOwner;
  if (code === "INVALID_EVENT_TIME") return texts.events.recurrence.timeRequired;
  return texts.events.recurrence.updateError;
}

export const Route = createFileRoute("/eventos")({
  validateSearch: (search: Record<string, unknown>): { evento?: string } => ({
    evento:
      typeof search.evento === "string" && search.evento.length > 0 ? search.evento : undefined,
  }),
  head: () => ({ meta: [{ title: texts.events.seoTitle }] }),
  component: Eventos,
});

function Eventos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { evento: highlightedId } = Route.useSearch();
  const cardRef = useRef<HTMLElement | null>(null);
  const [highlightOn, setHighlightOn] = useState(false);
  // "Rituais" lists only series. The unfiltered list keeps the `["events"]` key the feed rail uses.
  const [ritualsOnly, setRitualsOnly] = useState(false);
  const [recurrenceError, setRecurrenceError] = useState<{ id: string; message: string } | null>(
    null,
  );
  // Dono do evento: editar (o formulário é o mesmo da criação) e excluir com confirmação.
  const [editing, setEditing] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState<Event | null>(null);

  const {
    data: eventsData,
    isLoading,
    error: listError,
  } = useQuery({
    queryKey: ritualsOnly ? ["events", "recurring"] : ["events"],
    queryFn: () => eventsApi.list(undefined, null, 20, ritualsOnly),
  });

  const events = eventsData?.items ?? [];

  // Deep link (?evento=id): rola até o card e o destaca por alguns segundos.
  //
  // A rolagem espera a lista chegar: o card só existe depois dela, e o link aberto em aba nova
  // chegava antes dos eventos e não rolava para lugar nenhum (o destaque até aparecia, mas fora
  // da tela). Depender da lista faz o efeito rodar de novo quando ela chega — com o card no lugar.
  useEffect(() => {
    if (!highlightedId || events.length === 0) return;
    const scroll = setTimeout(() => {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      cardRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      setHighlightOn(true);
    }, 250);
    const clear = setTimeout(() => setHighlightOn(false), 250 + HIGHLIGHT_MS);
    return () => {
      clearTimeout(scroll);
      clearTimeout(clear);
    };
  }, [highlightedId, events.length]);

  // Optimistic attendance on every cached list; the snapshot rolls all of them back.
  const optimisticAttendance = async (eventId: string, attending: boolean) => {
    await queryClient.cancelQueries({ queryKey: ["events"] });
    const previous: EventListsSnapshot = queryClient.getQueriesData<PageResponse<Event>>({
      queryKey: ["events"],
    });
    patchEventInLists(queryClient, eventId, (e) => withAttendance(e, attending));
    return { previous };
  };

  const rollback = (context: { previous: EventListsSnapshot } | undefined) =>
    context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));

  const attend = useMutation({
    mutationFn: (eventId: string) => eventsApi.attend(eventId),
    onMutate: (eventId) => optimisticAttendance(eventId, true),
    onError: (error, eventId, context) => {
      if (error instanceof ApiError && error.code === "ALREADY_ATTENDING") {
        patchEventInLists(queryClient, eventId, (e) => withAttendance(e, true));
        toast(texts.events.attendSuccess);
        return;
      }
      rollback(context);
      toast(texts.events.attendError, "error");
    },
    onSuccess: () => toast(texts.events.attendSuccess),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const cancelAttendance = useMutation({
    mutationFn: (eventId: string) => eventsApi.cancelAttendance(eventId),
    onMutate: (eventId) => optimisticAttendance(eventId, false),
    onError: (error, eventId, context) => {
      if (error instanceof ApiError && error.code === "NOT_ATTENDING") {
        patchEventInLists(queryClient, eventId, (e) => withAttendance(e, false));
        toast(texts.events.cancelAttendanceSuccess);
        return;
      }
      rollback(context);
      toast(texts.events.cancelAttendanceError, "error");
    },
    onSuccess: () => toast(texts.events.cancelAttendanceSuccess),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const attendancePending = attend.isPending || cancelAttendance.isPending;

  const changeRecurrence = useMutation({
    mutationFn: ({ eventId, recurrence }: { eventId: string; recurrence: EventRecurrence }) =>
      eventsApi.setRecurrence(eventId, recurrence),
    onMutate: () => setRecurrenceError(null),
    onSuccess: (updated) => {
      patchEventInLists(queryClient, updated.id, () => updated);
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error, { eventId }) =>
      setRecurrenceError({ id: eventId, message: recurrenceErrorMessage(error) }),
  });

  const createEvent = useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
    },
    // Cidade/UF aparece embaixo do campo; o resto vira aviso (antes a recusa passava calada).
    onError: (error) => {
      if (cityStateErrorCode(error)) return;
      const code = error instanceof ApiError ? error.code : undefined;
      toast(
        code === "INVALID_EVENT_TIME"
          ? texts.events.recurrence.timeRequired
          : error instanceof ApiError
            ? error.message
            : texts.events.createError,
        "error",
      );
    },
  });

  const updateEvent = useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: CreateEventRequest }) => {
      // A recorrência tem endpoint próprio: a edição do conteúdo não mexe na série.
      const { recurrence: _ignored, ...content } = data;
      return eventsApi.update(eventId, content);
    },
    onSuccess: (updated) => {
      patchEventInLists(queryClient, updated.id, () => updated);
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      setEditing(null);
      toast(texts.events.editSuccess, "success");
    },
    onError: (error) => {
      if (cityStateErrorCode(error)) return;
      const code = error instanceof ApiError ? error.code : undefined;
      toast(
        code === "NOT_EVENT_OWNER"
          ? texts.events.editNotOwner
          : error instanceof ApiError
            ? error.message
            : texts.events.editError,
        "error",
      );
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (eventId: string) => eventsApi.remove(eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      setDeleting(null);
      toast(texts.events.deleteSuccess, "success");
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast(
        code === "NOT_EVENT_OWNER" ? texts.events.editNotOwner : texts.events.deleteError,
        "error",
      );
    },
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <PageHeader
          title={texts.events.title}
          description={texts.events.description}
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full gap-1.5">
                  <Plus className="h-4 w-4" />

                  <>{texts.events.createEvent}</>
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{texts.events.createEvent}</DialogTitle>
                </DialogHeader>

                <EventForm
                  onSave={(data) => {
                    requireAuth();
                    createEvent.mutate(data);
                  }}
                  isPending={createEvent.isPending}
                  error={createEvent.error}
                />
              </DialogContent>
            </Dialog>
          }
        />
        <EventRitualsFilter value={ritualsOnly} onChange={setRitualsOnly} />

        {isLoading ? (
          <LoadingState label={texts.events.loading} />
        ) : listError ? (
          <ErrorBanner error={listError} showDetails={false} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={ritualsOnly ? texts.events.emptyRituals : texts.events.empty}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <div key={e.id} className="min-w-0 space-y-2">
                <EventCard
                  event={withPlace(e)}
                  dateTimeLabel={texts.events.dateTime(e.date ?? "", e.time ?? "")}
                  attendancePending={attendancePending}
                  onAttend={() => {
                    requireAuth();
                    attend.mutate(e.id);
                  }}
                  onCancelAttend={() => {
                    requireAuth();
                    cancelAttendance.mutate(e.id);
                  }}
                  highlighted={e.id === highlightedId && highlightOn}
                  ref={e.id === highlightedId ? cardRef : undefined}
                />

                {e.canManageRecurrence && (
                  <div className="surface-card space-y-3 p-4">
                    {!e.expired && (
                      <EventRecurrenceControl
                        value={e.recurrence ?? "NONE"}
                        onChange={(recurrence) =>
                          changeRecurrence.mutate({ eventId: e.id, recurrence })
                        }
                        pending={
                          changeRecurrence.isPending && changeRecurrence.variables?.eventId === e.id
                        }
                        error={recurrenceError?.id === e.id ? recurrenceError.message : null}
                      />
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full gap-1.5"
                        onClick={() => setEditing(e)}
                      >
                        <Pencil className="h-3.5 w-3.5" />

                        <>{texts.events.edit}</>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full gap-1.5 text-destructive"
                        onClick={() => setDeleting(e)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />

                        <>{texts.events.remove}</>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-h-[88vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{texts.events.editTitle}</DialogTitle>
            </DialogHeader>

            {editing && (
              <EventForm
                initial={editing}
                onSave={(data) => {
                  requireAuth();
                  updateEvent.mutate({ eventId: editing.id, data });
                }}
                isPending={updateEvent.isPending}
                error={updateEvent.error}
              />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleting !== null}
          onOpenChange={(open) => !open && setDeleting(null)}
          title={texts.events.deleteTitle}
          description={texts.events.deleteDescription}
          confirmLabel={texts.events.remove}
          destructive
          pending={deleteEvent.isPending}
          onConfirm={() => deleting && deleteEvent.mutate(deleting.id)}
        />
      </div>
    </AppContainer>
  );
}

function EventForm({ initial, onSave, isPending, error }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [format, setFormat] = useState<CreateEventRequest["format"]>(initial?.format ?? "ONLINE");
  const [host, setHost] = useState(initial?.host ?? "");
  const [cover, setCover] = useState<string | null>(initial?.cover ?? null);
  const [streamUrl, setStreamUrl] = useState(initial?.streamUrl ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  // A recorrência só existe na criação: mudá-la depois é o controle próprio do card.
  const [recurrence, setRecurrence] = useState<EventRecurrence>("NONE");
  // The time rule shows only after a save attempt, not while the person is still filling the form.
  const [triedSave, setTriedSave] = useState(false);
  const timeMissing = recurrence !== "NONE" && !time;
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverUpload = useMediaUpload();
  // Cidade/UF estruturadas só para encontro presencial ou híbrido (a API recusa no online).
  const place = useCityState(initial ? { city: initial.city, state: initial.state } : null, error);
  const inPerson = format !== "ONLINE";

  const handleCoverChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const result = await coverUpload.upload(file, "COVER");
      setCover(result.cdnUrl);
    } catch {
      // o proprio hook guarda o erro de upload
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <Field label={texts.events.form.title}>
        {/* O limite e o mesmo da coluna (`events.title varchar(255)`) e que a API recusa com 400
            dizendo o campo: sem ele no campo, a pessoa tomava 409 sem entender o motivo. */}
        <Input
          value={title}
          maxLength={255}
          onChange={(e) => setTitle(e.target.value)}
          className="h-10 border-transparent bg-muted"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={texts.events.form.date}>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 border-transparent bg-muted"
          />
        </Field>

        <Field label={texts.events.form.time}>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-10 border-transparent bg-muted"
          />
        </Field>
      </div>

      <Field label={texts.events.form.host}>
        <Input
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder={texts.events.form.hostPlaceholder}
          className="h-10 border-transparent bg-muted"
        />
      </Field>

      <Field label={texts.events.form.cover}>
        <div className="space-y-2">
          {cover ? (
            <div className="relative overflow-hidden rounded-xl border border-border-soft">
              <img src={resolveCdnUrl(cover)} alt="" className="h-28 w-full object-cover" />

              <button
                type="button"
                onClick={() => setCover(null)}
                aria-label={texts.events.form.removeCover}
                title={texts.events.form.removeCover}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-card/85 text-text-strong shadow transition hover:bg-card"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
              disabled={coverUpload.status === "uploading"}
              onClick={() => coverInputRef.current?.click()}
            >
              <ImagePlus className="h-3.5 w-3.5" />

              <>
                {coverUpload.status === "uploading"
                  ? texts.events.form.coverUploading
                  : texts.events.form.coverAction}
              </>
            </Button>
          )}

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>
      </Field>

      {/* Cada formato pede um dado: online pede o link, presencial pede o lugar, hibrido pede os dois. */}
      {format !== "IN_PERSON" && (
        <Field label={texts.events.form.streamUrl}>
          <Input
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder={texts.events.form.streamUrlPlaceholder}
            className="h-10 border-transparent bg-muted"
          />
        </Field>
      )}

      {format !== "ONLINE" && (
        <Field label={texts.events.form.location}>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={texts.events.form.locationPlaceholder}
            className="h-10 border-transparent bg-muted"
          />
        </Field>
      )}

      {inPerson && <CityStateField idPrefix="event-place" disabled={isPending} {...place.field} />}

      {!initial && (
        <EventRecurrenceField
          value={recurrence}
          onChange={setRecurrence}
          error={triedSave && timeMissing ? texts.events.recurrence.timeRequired : null}
          disabled={isPending}
        />
      )}

      <Field label={texts.events.form.format}>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as CreateEventRequest["format"])}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10 border-transparent bg-muted"
        >
          <option value="ONLINE">{texts.events.formats.ONLINE}</option>

          <option value="IN_PERSON">{texts.events.formats.IN_PERSON}</option>

          <option value="HYBRID">{texts.events.formats.HYBRID}</option>
        </select>
      </Field>

      <Button
        className="w-full rounded-full"
        disabled={!title.trim() || !date || !host.trim() || isPending}
        onClick={() => {
          setTriedSave(true);
          if (timeMissing) return;
          if (inPerson && !place.validate()) return;
          onSave({
            title,
            date,
            time,
            format,
            host,
            cover: cover ?? undefined,
            streamUrl: streamUrl.trim() || undefined,
            location: location.trim() || undefined,
            recurrence,
            ...(inPerson && place.payload.state ? place.payload : {}),
          });
        }}
      >
        {isPending
          ? initial
            ? texts.common.saving
            : texts.common.creating
          : initial
            ? texts.events.saveEdit
            : texts.events.createEvent}
      </Button>
    </div>
  );
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
