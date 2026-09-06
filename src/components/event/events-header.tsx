import { texts } from "@/texts";
import type { EventsHeaderProps } from "@/types/components/event/events-header-props";

import { CreateEventDialog } from "./create-event-dialog";

export function EventsHeader({ isCreateDialogOpen, isCreating, onCreateDialogOpenChange, onCreate }: EventsHeaderProps) {
  return <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6"><div><h1 className="text-2xl font-semibold tracking-tight">{texts.events.title}</h1><p className="mt-1 text-sm text-muted-foreground">{texts.events.description}</p></div><CreateEventDialog isOpen={isCreateDialogOpen} isCreating={isCreating} onOpenChange={onCreateDialogOpenChange} onCreate={onCreate} /></div>;
}
