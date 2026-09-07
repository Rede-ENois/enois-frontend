import { texts } from "@/texts";
import type { ForgotPasswordDialogProps } from "@/types/routes/auth/forgot-password-dialog-props";
import { Root as Dialog } from "@radix-ui/react-dialog";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";

import { useForgotPasswordDialogController } from "@/lib/use-forgot-password-dialog-controller";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Input } from "@/components/ui/input";

import { ErrorBanner } from "@/components/error-banner";
import { FormField } from "@/components/form-field";

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const { errors, formError, loading, sent, submit, close, handleOpenChange } =
    useForgotPasswordDialogController(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold tracking-tight">
            {texts.auth.forgot.title}
          </DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="space-y-4 pb-2 pt-2">
            <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-4">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

              <div>
                <p className="text-sm font-medium">{texts.auth.forgot.checkEmail}</p>

                <p className="mt-1 text-[13px] text-muted-foreground">
                  {texts.auth.forgot.sentDescription}
                </p>
              </div>
            </div>

            <Button className="w-full rounded-full" onClick={close}>
              {texts.auth.forgot.understood}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 pb-2 pt-2" noValidate>
            <p className="text-sm text-muted-foreground">{texts.auth.forgot.description}</p>

            <FormField label={texts.auth.fields.email} error={errors.email}>
              <Input
                name="email"
                type="email"
                placeholder={texts.auth.placeholders.email}
                autoComplete="email"
                required
                maxLength={255}
              />
            </FormField>
            {formError !== null && <ErrorBanner error={formError} />}
            <Button type="submit" className="w-full gap-2 rounded-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <>{texts.auth.forgot.sendLink} </>

                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
