import { useEventCardDetailsController } from "@/utils/components/events/use-event-card-details-controller";

import { Badge } from "@/components/ui/badge";

export function EventCardDetails() {
  const { FormatIcon, formatLabel, title, hostLabel } = useEventCardDetailsController();

  return (
    <>
      <Badge variant="outline" className="rounded-full bg-card font-normal">
        <FormatIcon className="mr-1 h-3 w-3" />

        <>{formatLabel}</>
      </Badge>

      <h3 className="mt-2 break-words font-semibold">{title}</h3>

      <p className="mt-1 text-xs text-muted-foreground">{hostLabel}</p>
    </>
  );
}
