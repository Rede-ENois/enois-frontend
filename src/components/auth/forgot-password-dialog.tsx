import { texts } from "@/texts";
import type { ForgotPasswordDialogProps } from "@/types/routes/auth/forgot-password-dialog-props";
import { Root as Dialog } from "@radix-ui/react-dialog";

import { useForgotPasswordDialogController } from "@/utils/components/auth/use-forgot-password-dialog-controller";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ForgotPasswordForm } from "./forgot-password-form";
import { ForgotPasswordSuccess } from "./forgot-password-success";

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const controller = useForgotPasswordDialogController(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={controller.handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold tracking-tight">
            {texts.auth.forgot.title}
          </DialogTitle>
        </DialogHeader>

        {controller.sent ? (
          <ForgotPasswordSuccess onClose={controller.close} />
        ) : (
          <ForgotPasswordForm
            errors={controller.errors}
            formError={controller.formError}
            loading={controller.loading}
            submit={controller.submit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
