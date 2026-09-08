import { useForgotPasswordStore } from "@/stores/forgot-password.store";
import { texts } from "@/texts";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ForgotPasswordForm } from "./forgot-password-form";
import { ForgotPasswordSuccess } from "./forgot-password-success";

export function ForgotPasswordDialog() {
  const open = useForgotPasswordStore((state) => state.open);
  const sent = useForgotPasswordStore((state) => state.sent);
  const setOpen = useForgotPasswordStore((state) => state.setOpen);

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
