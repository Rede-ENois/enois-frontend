import type { ResetPasswordFormProps } from "@/types/components/auth/reset-password-form-props";

import { useLoginRouteNavigation } from "@/utils/components/auth/use-login-route-navigation";
import { useResetPasswordSubmission } from "@/utils/components/auth/use-reset-password-submission";

export function useResetPasswordFormController(token: ResetPasswordFormProps["token"]) {
  const submission = useResetPasswordSubmission(token);
  const goToLogin = useLoginRouteNavigation();

  return { ...submission, goToLogin };
}
