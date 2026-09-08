import { texts } from "@/texts";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CreateEventTrigger() {
  return (
    <Button className="rounded-full gap-1.5">
      <Plus className="h-4 w-4" />

      <>{texts.events.createEvent}</>
    </Button>
  );
}
