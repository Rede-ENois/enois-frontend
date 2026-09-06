import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
import type { ControlledDialogProps } from "@/types/components/shared/controlled-dialog-props";

export type RegisterMentorDialogProps = ControlledDialogProps & {
  isPending: boolean;
  onRegister: (values: CreateMentorInput) => void;
};
