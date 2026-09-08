import type { FormEventHandler } from "react";

export type ResetPasswordContentProps = {
  errors: Record<string, string>;
  loading: boolean;
  submit: FormEventHandler<HTMLFormElement>;
};
