import { useResetPasswordFormContext } from "@/utils/auth/use-reset-password-form-context";

import { ResetPasswordContent } from "./reset-password-content";
import { ResetPasswordSuccess } from "./reset-password-success";

export function ResetPasswordForm() {
  const { done } = useResetPasswordFormContext();

  return done ? <ResetPasswordSuccess /> : <ResetPasswordContent />;
}
