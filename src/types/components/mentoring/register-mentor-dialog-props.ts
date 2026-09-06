import type { RegisterMentorFormValues } from "./register-mentor-form-values";

export type RegisterMentorDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRegister: (values: RegisterMentorFormValues) => void;
};
