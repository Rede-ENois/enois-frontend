import type { FormEventHandler } from "react";

export type ForgotPasswordFormProps = {
  errors: Record<string, string>;
  formError: unknown;
  loading: boolean;
  submit: FormEventHandler<HTMLFormElement>;
};
