import type { ForgotPasswordDialogProps } from "@/types/routes/auth/forgot-password-dialog-props";

import { useForgotPasswordDialogState } from "@/utils/components/auth/use-forgot-password-dialog-state";
import { useForgotPasswordSubmission } from "@/utils/components/auth/use-forgot-password-submission";

export function useForgotPasswordDialogController(
  onOpenChange: ForgotPasswordDialogProps["onOpenChange"],
) {
  const submission = useForgotPasswordSubmission();
  const dialog = useForgotPasswordDialogState(onOpenChange, submission.reset);

  return {
    errors: submission.errors,
    formError: submission.formError,
    loading: submission.loading,
    sent: submission.sent,
    submit: submission.submit,
    ...dialog,
  };
}
