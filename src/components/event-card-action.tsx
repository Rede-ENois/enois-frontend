import { texts } from "@/texts";
import { useEventCardContext } from "@/utils/components/events/use-event-card-context";

import { Button } from "@/components/ui/button";

export function EventCardAction() {
  const { attending, attend } = useEventCardContext();

  return (
    <Button className="mt-4 w-full rounded-full" disabled={attending} onClick={attend}>
      {texts.events.attend}
    </Button>
  );
}
