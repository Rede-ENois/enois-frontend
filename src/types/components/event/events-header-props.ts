import type { CreateEventFormValues } from "./create-event-form-values";

export type EventsHeaderProps = {
  isCreateDialogOpen: boolean;
  isCreating: boolean;
  onCreateDialogOpenChange: (isOpen: boolean) => void;
  onCreate: (values: CreateEventFormValues) => void;
};
