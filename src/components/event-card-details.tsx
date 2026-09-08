import { texts } from "@/texts";
import type { EventCardDetailsProps } from "@/types/components/events/event-card-details-props";

import { Badge } from "@/components/ui/badge";

export function EventCardDetails({ event, formatIcon, formatLabel }: EventCardDetailsProps) {
  const FormatIcon = formatIcon;

  return (
    <>
      <Badge variant="outline" className="rounded-full bg-card font-normal">
        <FormatIcon className="mr-1 h-3 w-3" />

        <>{formatLabel}</>
      </Badge>

      <h3 className="mt-2 break-words font-semibold">{event.title}</h3>

      <p className="mt-1 text-xs text-muted-foreground">{texts.events.hostedBy(event.host)}</p>
    </>
  );
}
