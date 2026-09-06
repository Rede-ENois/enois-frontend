import type { CreateEventFormValues } from "./create-event-form-values";

export type CreateEventDialogProps = {
  isOpen: boolean;
  isCreating: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (values: CreateEventFormValues) => void;
};
