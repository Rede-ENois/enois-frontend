import type { ForgotPasswordDialogProps } from "@/types/routes/auth/forgot-password-dialog-props";

export function useForgotPasswordDialogState(
  onOpenChange: ForgotPasswordDialogProps["onOpenChange"],
  reset: () => void,
) {
  const close = () => {
    reset();
    onOpenChange(false);
  };

  return {
    close,
    handleOpenChange: (open: boolean) => {
      if (open) onOpenChange(true);
      else close();
    },
  };
}
