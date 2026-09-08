import { texts } from "@/texts";
import type { EventCardActionProps } from "@/types/components/events/event-card-action-props";

import { Button } from "@/components/ui/button";

export function EventCardAction({ attending, onAttend }: EventCardActionProps) {
  return (
    <Button className="mt-4 w-full rounded-full" disabled={attending} onClick={onAttend}>
      {texts.events.attend}
    </Button>
  );
}
