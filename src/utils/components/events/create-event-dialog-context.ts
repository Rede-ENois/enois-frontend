import { createContext } from "react";

import type { useCreateEventDialogController } from "@/utils/components/events/use-create-event-dialog-controller";

export const CreateEventDialogContext = createContext<ReturnType<
  typeof useCreateEventDialogController
> | null>(null);
