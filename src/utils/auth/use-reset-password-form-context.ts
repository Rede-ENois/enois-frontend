import { useContext } from "react";

import { ResetPasswordFormContext } from "@/utils/components/auth/reset-password-form-context";

export function useResetPasswordFormContext() {
  const context = useContext(ResetPasswordFormContext);

  if (!context) {
    throw new Error("Reset password components must be rendered inside ResetPasswordFormProvider");
  }

  return context;
}
