import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Video } from "lucide-react";

import { texts } from "@/texts";
import type { EventCardProps } from "@/types/components/events/event-card-props";

import { attendEvent } from "@/lib/api/events/attend-event";
import { resolveCdnUrl } from "@/lib/api/media";

export function useEventCardController({ event }: EventCardProps) {
  const queryClient = useQueryClient();
  const attend = useMutation({
    mutationFn: () => attendEvent(event.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
  const [, month, day] = (event.date ?? "").split("-");

  return {
    coverUrl: event.cover ? resolveCdnUrl(event.cover) : null,
    FormatIcon: event.format === "ONLINE" ? Video : MapPin,
    formatLabel: texts.events.formats[event.format] ?? event.format,
    monthLabel: texts.events.months[Number(month)] ?? month,
    dayLabel: day ?? "",
    dateTimeLabel: texts.events.dateTime(event.date ?? "", event.time ?? ""),
    attend: () => attend.mutate(),
    attending: attend.isPending,
  };
}
