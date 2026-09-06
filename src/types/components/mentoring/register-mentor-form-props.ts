import type { RegisterMentorFormValues } from "./register-mentor-form-values";

export type RegisterMentorFormProps = {
  onSave: (values: RegisterMentorFormValues) => void;
  isPending: boolean;
};
