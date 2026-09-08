import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { texts } from "@/texts";

import { useForgotPasswordDialogController } from "@/utils/components/auth/use-forgot-password-dialog-controller";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ForgotPasswordForm } from "./forgot-password-form";
import { ForgotPasswordSuccess } from "./forgot-password-success";

export function ForgotPasswordDialog() {
  const controller = useForgotPasswordDialogController();

  return (
    <Dialog open={controller.open} onOpenChange={controller.handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className="text-xs font-medium text-primary hover:underline">
          {texts.auth.password.forgot}
        </button>
      </DialogTrigger>

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
