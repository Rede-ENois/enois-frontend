import { Calendar, MapPin, Users, Video } from "lucide-react";

import { resolveCdnUrl } from "@/lib/api/media";
import { useEventAttendance } from "@/lib/use-event-attendance";
import { texts } from "@/texts";
import type { EventCardProps } from "@/types/components/events/event-card-props";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EventCard({ event }: EventCardProps) {
  const { attend, attending } = useEventAttendance(event.id);
  const formatLabel = texts.events.formats[event.format] ?? event.format;
  const Icon = event.format === "ONLINE" ? Video : MapPin;
  const [, month, day] = (event.date ?? "").split("-");

  return (
    <article className="surface-card overflow-hidden">
      <div className="relative">
        {event.cover ? (
          <img src={resolveCdnUrl(event.cover)} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute left-4 top-4 rounded-xl bg-card/95 px-3 py-2 text-center shadow-md backdrop-blur">
          <p className="text-[10px] font-medium uppercase text-primary">
            {texts.events.months[Number(month)] ?? month}
          </p>
          <p className="text-lg font-semibold leading-none">{day ?? ""}</p>
        </div>
      </div>
      <div className="p-5">
        <Badge variant="outline" className="rounded-full bg-card font-normal">
          <Icon className="mr-1 h-3 w-3" /><>{formatLabel}</>
        </Badge>
        <h3 className="mt-2 break-words font-semibold">{event.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{texts.events.hostedBy(event.host)}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <>{texts.events.dateTime(event.date ?? "", event.time ?? "")}</>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /><>{event.attendees ?? 0}</>
          </span>
        </div>
        <Button className="mt-4 w-full rounded-full" disabled={attending} onClick={attend}>
          {texts.events.attend}
        </Button>
      </div>
    </article>
  );
}
