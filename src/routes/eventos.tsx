import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { PageResponse } from "@/types/application/api/page-response";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";
import type { Event } from "@/types/application/event/event";
import type { CreateEventFormProps } from "@/types/routes/events/create-event-form-props";
import type { FieldProps } from "@/types/routes/events/field-props";
import { Calendar, Check, ImagePlus, MapPin, Plus, Users, Video, X } from "lucide-react";

import { eventsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { resolveCdnUrl } from "@/lib/api/media";
import { requireAuth } from "@/lib/require-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";

function patchEventAttendance(
  page: PageResponse<Event> | undefined,
  eventId: string,
  attending: boolean,
): PageResponse<Event> | undefined {
  if (!page) return page;
  return {
    ...page,
    items: page.items.map((event) => {
      if (event.id !== eventId || event.attending === attending) return event;
      const attendees = Math.max(0, (event.attendees ?? 0) + (attending ? 1 : -1));
      return { ...event, attending, attendees };
    }),
  };
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
  const { evento: eventoDestacado } = Route.useSearch();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [recemChegado, setRecemChegado] = useState(false);

  const { data: eventsData } = useQuery({
    queryKey: ["events"],
    queryFn: () => eventsApi.list(),
  });

  const events = eventsData?.items ?? [];

  const setAttendance = (eventId: string, attending: boolean) => {
    queryClient.setQueryData<PageResponse<Event>>(["events"], (prev) =>
      patchEventAttendance(prev, eventId, attending),
    );
  };

  // Deep link (?evento=id): rola até o card e o destaca por alguns segundos.
  //
  // A rolagem espera a lista chegar: o card só existe depois dela, e o link aberto em aba nova
  // chegava antes dos eventos e não rolava para lugar nenhum (o destaque até aparecia, mas fora
  // da tela). Depender da lista faz o efeito rodar de novo quando ela chega — com o card no lugar.
  useEffect(() => {
    if (!eventoDestacado || events.length === 0) return;
    const rolar = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setRecemChegado(true);
    }, 250);
    const apagar = setTimeout(() => setRecemChegado(false), 4250);
    return () => {
      clearTimeout(rolar);
      clearTimeout(apagar);
    };
  }, [eventoDestacado, events.length]);

  const attend = useMutation({
    mutationFn: (eventId: string) => eventsApi.attend(eventId),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      const previous = queryClient.getQueryData<PageResponse<Event>>(["events"]);
      setAttendance(eventId, true);
      return { previous };
    },
    onError: (error, eventId, context) => {
      if (error instanceof ApiError && error.code === "ALREADY_ATTENDING") {
        setAttendance(eventId, true);
        toast(texts.events.attendSuccess);
        return;
      }
      if (context?.previous) queryClient.setQueryData(["events"], context.previous);
      toast(texts.events.attendError, "error");
    },
    onSuccess: () => toast(texts.events.attendSuccess),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const cancelAttendance = useMutation({
    mutationFn: (eventId: string) => eventsApi.cancelAttendance(eventId),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      const previous = queryClient.getQueryData<PageResponse<Event>>(["events"]);
      setAttendance(eventId, false);
      return { previous };
    },
    onError: (error, eventId, context) => {
      if (error instanceof ApiError && error.code === "NOT_ATTENDING") {
        setAttendance(eventId, false);
        toast(texts.events.cancelAttendanceSuccess);
        return;
      }
      if (context?.previous) queryClient.setQueryData(["events"], context.previous);
      toast(texts.events.cancelAttendanceError, "error");
    },
    onSuccess: () => toast(texts.events.cancelAttendanceSuccess),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const attendancePending = attend.isPending || cancelAttendance.isPending;

  const createEvent = useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
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

                <CreateEventForm
                  onSave={(data) => {
                    requireAuth();
                    createEvent.mutate(data);
                  }}
                  isPending={createEvent.isPending}
                />
              </DialogContent>
            </Dialog>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const formatLabel = texts.events.formats[e.format] ?? e.format;
            const Icon = e.format === "ONLINE" ? Video : MapPin;
            const [, month, day] = (e.date ?? "").split("-");
            const isAttending = e.attending === true;
            return (
              <article
                key={e.id}
                id={`evento-${e.id}`}
                ref={e.id === eventoDestacado ? cardRef : undefined}
                className={`surface-card overflow-hidden transition ${
                  e.id === eventoDestacado && recemChegado
                    ? "ring-2 ring-primary"
                    : isAttending
                      ? "ring-2 ring-primary/45"
                      : ""
                }`}
              >
                <div className="relative">
                  {e.cover ? (
                    <img src={resolveCdnUrl(e.cover)} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                  <div className="absolute left-4 top-4 rounded-xl bg-card/95 px-3 py-2 text-center shadow-md backdrop-blur">
                    <p className="text-xs font-medium uppercase text-primary">
                      {texts.events.months[Number(month)] ?? month}
                    </p>

                    <p className="text-lg font-semibold leading-none">{day ?? ""}</p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full bg-card font-normal">
                      <Icon className="mr-1 h-3 w-3" />

                      <>{formatLabel}</>
                    </Badge>

                    {isAttending && !e.expired ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-primary/30 bg-primary/10 font-normal text-primary"
                      >
                        <Check className="mr-1 h-3 w-3" />

                        <>{texts.events.youAreGoing}</>
                      </Badge>
                    ) : null}

                    {e.expired && (
                      <Badge
                        variant="outline"
                        className="rounded-full bg-muted font-normal text-text-subtle"
                      >
                        <>{texts.events.finished}</>
                      </Badge>
                    )}
                  </div>

                  <h3 className="mt-2 break-words font-semibold">{e.title}</h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {texts.events.hostedBy(e.host)}
                  </p>

                  {e.location && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />

                      <>{e.location}</>
                    </p>
                  )}

                  {e.streamUrl && !e.expired && (
                    <a
                      href={e.streamUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      <Video className="h-3.5 w-3.5" />

                      <>{texts.events.watchLive}</>
                    </a>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />

                      <>{texts.events.dateTime(e.date ?? "", e.time ?? "")}</>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />

                      <>{e.attendees ?? 0}</>
                    </span>
                  </div>

                  {e.expired ? (
                    <p className="mt-4 rounded-full bg-muted px-4 py-2 text-center text-xs font-normal text-text-subtle">
                      {texts.events.finished}
                    </p>
                  ) : (
                    <Button
                      className="mt-4 w-full rounded-full"
                      variant={isAttending ? "outline" : "default"}
                      disabled={attendancePending}
                      onClick={() => {
                        requireAuth();
                        if (isAttending) {
                          cancelAttendance.mutate(e.id);
                        } else {
                          attend.mutate(e.id);
                        }
                      }}
                    >
                      <>{isAttending ? texts.events.cancelAttend : texts.events.attend}</>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppContainer>
  );
}

function CreateEventForm({ onSave, isPending }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [format, setFormat] = useState<CreateEventRequest["format"]>("ONLINE");
  const [host, setHost] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [location, setLocation] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverUpload = useMediaUpload();

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
        <Input
          value={title}
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
        onClick={() =>
          onSave({
            title,
            date,
            time,
            format,
            host,
            cover: cover ?? undefined,
            streamUrl: streamUrl.trim() || undefined,
            location: location.trim() || undefined,
          })
        }
      >
        {isPending ? texts.common.creating : texts.events.createEvent}
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
