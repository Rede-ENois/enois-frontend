import { Calendar, MapPin, Users, Video } from "lucide-react";

import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";
import type { EventCardProps } from "@/types/components/event/event-card-props";
import { getIsoDateParts } from "@/utils/time";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const eventFormatIcons: Record<keyof typeof texts.events.formats, React.ElementType> = { ONLINE: Video, IN_PERSON: MapPin, HYBRID: MapPin };

export function EventCard({ event, isAttending, onAttend }: EventCardProps) {
  const formatKey = event.format as keyof typeof texts.events.formats;
  const formatLabel = texts.events.formats[formatKey] ?? event.format;
  const FormatIcon = eventFormatIcons[formatKey] ?? MapPin;
  const { month, day } = getIsoDateParts(event.date);
  return <article className="surface-card overflow-hidden"><div className="relative">{event.cover ? <img src={resolveCdnUrl(event.cover)} alt="" className="h-40 w-full object-cover" /> : <div className="h-40 w-full bg-gradient-to-br from-primary/20 to-primary/5" />}<div className="absolute left-4 top-4 rounded-xl bg-card/95 px-3 py-2 text-center shadow-md backdrop-blur"><p className="text-[10px] font-medium uppercase text-primary">{texts.events.months[Number(month)] ?? month}</p><p className="text-lg font-semibold leading-none">{day}</p></div></div><div className="p-5"><Badge variant="outline" className="rounded-full bg-card font-normal"><FormatIcon className="mr-1 h-3 w-3" /> {formatLabel}</Badge><h3 className="mt-2 break-words font-semibold">{event.title}</h3><p className="mt-1 text-xs text-muted-foreground">{texts.events.hostedBy(event.host)}</p><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {event.date ?? ""} · {event.time ?? ""}</span><span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {event.attendees ?? 0}</span></div><Button className="mt-4 w-full rounded-full" disabled={isAttending} onClick={() => onAttend(event.id)}>{texts.events.attend}</Button></div></article>;
}
