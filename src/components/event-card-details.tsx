import { texts } from "@/texts";
import { useEventCardContext } from "@/utils/components/events/use-event-card-context";

import { Badge } from "@/components/ui/badge";

export function EventCardDetails() {
  const { event, FormatIcon, formatLabel } = useEventCardContext();

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
