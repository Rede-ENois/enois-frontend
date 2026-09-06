import type { ControlledDialogProps } from "@/types/components/shared/controlled-dialog-props";

import type { CreateEventFormValues } from "./create-event-form-values";

export type CreateEventDialogProps = ControlledDialogProps & {
  isCreating: boolean;
  onCreate: (values: CreateEventFormValues) => void;
};
