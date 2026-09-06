import type { CreateEventFormValues } from "./create-event-form-values";

export type CreateEventFormProps = {
  onSave: (values: CreateEventFormValues) => void;
  isPending: boolean;
};
