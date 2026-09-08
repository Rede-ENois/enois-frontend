import { createContext } from "react";

import type { useCreateEventFormController } from "@/utils/components/events/use-create-event-form-controller";

export const CreateEventFormContext = createContext<ReturnType<
  typeof useCreateEventFormController
> | null>(null);
