import { useContext } from "react";

import { CreateEventFormContext } from "@/utils/components/events/create-event-form-context";

export function useCreateEventFormContext() {
  const context = useContext(CreateEventFormContext);

  if (!context) {
    throw new Error("Create event form components must be rendered inside CreateEventDialogProvider");
  }

  return context;
}
