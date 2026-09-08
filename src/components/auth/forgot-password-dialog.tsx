import { texts } from "@/texts";
import { useForgotPasswordDialogController } from "@/utils/auth/use-forgot-password-dialog-controller";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ForgotPasswordForm } from "./forgot-password-form";
import { ForgotPasswordSuccess } from "./forgot-password-success";

export function ForgotPasswordDialog() {
  const { open, sent, setOpen } = useForgotPasswordDialogController();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

        {sent ? <ForgotPasswordSuccess /> : <ForgotPasswordForm />}
      </DialogContent>
    </Dialog>
  );
}
