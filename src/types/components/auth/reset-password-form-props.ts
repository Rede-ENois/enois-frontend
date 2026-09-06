import type { FormEventHandler } from "react";

export type ResetPasswordFormProps = {
  errors: Record<string, string>;
  isSubmitting: boolean;
  isPasswordVisible: boolean;
  onTogglePassword: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};
