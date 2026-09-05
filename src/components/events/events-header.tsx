import { texts } from "@/texts";

import { CreateEventDialog } from "./create-event-dialog";
import type { CreateEventValues } from "./create-event-form";

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
      <CreateEventDialog
        open={open}
        creating={creating}
        onOpenChange={onOpenChange}
        onCreate={onCreate}
      />
    </div>
  );
}
