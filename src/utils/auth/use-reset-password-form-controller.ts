import { useSearch } from "@tanstack/react-router";

import { useLoginRouteNavigation } from "@/utils/components/auth/use-login-route-navigation";
import { useResetPasswordSubmission } from "@/utils/components/auth/use-reset-password-submission";

export function useResetPasswordFormController() {
  const token = useSearch({ from: "/auth/reset" }).token ?? "";
  const submission = useResetPasswordSubmission(token);
  const goToLogin = useLoginRouteNavigation();

  return { ...submission, goToLogin };
}
