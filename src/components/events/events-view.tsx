import { useState } from "react";

import { Calendar, MapPin, Plus, Users, Video } from "lucide-react";

import type { Event } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";
import { getIsoDateParts } from "@/utils/time";

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

const eventFormatIcons: Record<keyof typeof texts.events.formats, React.ElementType> = {
  ONLINE: Video,
  IN_PERSON: MapPin,
  HYBRID: MapPin,
};

export type CreateEventValues = {
  title: string;
  date: string;
  time: string;
  format: string;
  host: string;
};

export function EventsHeader({
  open,
  creating,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  creating: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: CreateEventValues) => void;
}) {
  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{texts.events.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{texts.events.description}</p>
      </div>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button className="rounded-full gap-1.5">
            <Plus className="h-4 w-4" /> {texts.events.createEvent}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{texts.events.createEvent}</DialogTitle>
          </DialogHeader>
          <CreateEventForm onSave={onCreate} isPending={creating} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EventsGrid({
  events,
  attending,
  onAttend,
}: {
  events: Event[];
  attending: boolean;
  onAttend: (eventId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const formatKey = event.format as keyof typeof texts.events.formats;
        const formatLabel = texts.events.formats[formatKey] ?? event.format;
        const FormatIcon = eventFormatIcons[formatKey] ?? MapPin;
        const { month, day } = getIsoDateParts(event.date);

        return (
          <article key={event.id} className="surface-card overflow-hidden">
            <div className="relative">
              {event.cover ? (
                <img
                  src={resolveCdnUrl(event.cover)}
                  alt=""
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="h-40 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
              <div className="absolute left-4 top-4 rounded-xl bg-card/95 px-3 py-2 text-center shadow-md backdrop-blur">
                <p className="text-[10px] font-medium uppercase text-primary">
                  {texts.events.months[Number(month)] ?? month}
                </p>
                <p className="text-lg font-semibold leading-none">{day}</p>
              </div>
            </div>

            <div className="p-5">
              <Badge variant="outline" className="rounded-full bg-card font-normal">
                <FormatIcon className="mr-1 h-3 w-3" /> {formatLabel}
              </Badge>
              <h3 className="mt-2 break-words font-semibold">{event.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {texts.events.hostedBy(event.host)}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {event.date ?? ""} · {event.time ?? ""}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {event.attendees ?? 0}
                </span>
              </div>
              <Button
                className="mt-4 w-full rounded-full"
                disabled={attending}
                onClick={() => onAttend(event.id)}
              >
                {texts.events.attend}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CreateEventForm({
  onSave,
  isPending,
}: {
  onSave: (data: CreateEventValues) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [format, setFormat] = useState("ONLINE");
  const [host, setHost] = useState("");

  return (
    <div className="space-y-4 pt-2">
      <Field label={texts.events.form.title}>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-10 border-transparent bg-muted"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={texts.events.form.date}>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 border-transparent bg-muted"
          />
        </Field>
        <Field label={texts.events.form.time}>
          <Input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="h-10 border-transparent bg-muted"
          />
        </Field>
      </div>
      <Field label={texts.events.form.host}>
        <Input
          value={host}
          onChange={(event) => setHost(event.target.value)}
          placeholder={texts.events.form.hostPlaceholder}
          className="h-10 border-transparent bg-muted"
        />
      </Field>
      <Field label={texts.events.form.format}>
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
        >
          {Object.entries(texts.events.formats).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Button
        className="w-full rounded-full"
        disabled={!title.trim() || !date || !host.trim() || isPending}
        onClick={() => onSave({ title, date, time, format, host })}
      >
        {isPending ? texts.common.creating : texts.events.createEvent}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
