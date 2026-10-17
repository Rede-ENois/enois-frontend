import { type ChangeEvent, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";
import type { CreateEventFormProps } from "@/types/routes/events/create-event-form-props";
import type { FieldProps } from "@/types/routes/events/field-props";
import { Calendar, ImagePlus, MapPin, Plus, Users, Video, X } from "lucide-react";

import { eventsApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { buildPageShareTags } from "@/lib/open-graph";
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

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/eventos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: buildPageShareTags({ title: texts.events.seoTitle, path: "/eventos" }) }),
  component: Eventos,
});

function Eventos() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: eventsData } = useQuery({
    queryKey: ["events"],
    queryFn: () => eventsApi.list(),
  });

  const events = eventsData?.items ?? [];

  const attend = useMutation({
    mutationFn: (eventId: string) => eventsApi.attend(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

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
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{texts.events.title}</h1>

            <p className="mt-1 text-sm text-muted-foreground">{texts.events.description}</p>
          </div>

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
                onSave={(data) => createEvent.mutate(data)}
                isPending={createEvent.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const formatLabel = texts.events.formats[e.format] ?? e.format;
            const Icon = e.format === "ONLINE" ? Video : MapPin;
            const [, month, day] = (e.date ?? "").split("-");
            return (
              <article key={e.id} className="surface-card overflow-hidden">
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
                      disabled={attend.isPending}
                      onClick={() => attend.mutate(e.id)}
                    >
                      {texts.events.attend}
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
