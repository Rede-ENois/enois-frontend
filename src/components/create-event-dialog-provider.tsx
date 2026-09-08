import { CreateEventDialogContext } from "@/utils/components/events/create-event-dialog-context";
import { CreateEventFormContext } from "@/utils/components/events/create-event-form-context";
import { useCreateEventDialogController } from "@/utils/components/events/use-create-event-dialog-controller";
import { useCreateEventFormController } from "@/utils/components/events/use-create-event-form-controller";

import { CreateEventDialog } from "@/components/create-event-dialog";

export function CreateEventDialogProvider() {
  const dialog = useCreateEventDialogController();
  const form = useCreateEventFormController(dialog.close);

  return (
    <CreateEventDialogContext.Provider value={dialog}>
      <CreateEventFormContext.Provider value={form}>
        <CreateEventDialog />
      </CreateEventFormContext.Provider>
    </CreateEventDialogContext.Provider>
  );
}
