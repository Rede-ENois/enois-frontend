import { useContext } from "react";

import { CreateEventDialogContext } from "@/utils/components/events/create-event-dialog-context";

export function useCreateEventDialogContext() {
  const context = useContext(CreateEventDialogContext);

  if (!context) {
    throw new Error("Create event dialog components must be rendered inside CreateEventDialogProvider");
  }

  return context;
}
