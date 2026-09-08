import { useForgotPasswordDialogState } from "@/utils/components/auth/use-forgot-password-dialog-state";
import { useForgotPasswordSubmission } from "@/utils/components/auth/use-forgot-password-submission";

export function useForgotPasswordDialogController() {
  const submission = useForgotPasswordSubmission();
  const dialog = useForgotPasswordDialogState(submission.reset);

  return {
    errors: submission.errors,
    formError: submission.formError,
    loading: submission.loading,
    sent: submission.sent,
    submit: submission.submit,
    ...dialog,
  };
}
