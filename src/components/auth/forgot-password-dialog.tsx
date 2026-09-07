import { type FormEvent, useState } from "react";

import { Root as Dialog } from "@radix-ui/react-dialog";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";

import { authApi } from "@/lib/api/auth";
import { texts } from "@/texts";
import type { ForgotPasswordDialogProps } from "@/types/routes/auth/forgot-password-dialog-props";

import { ErrorBanner } from "@/components/error-banner";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Input } from "@/components/ui/input";

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    if (!z.string().email().safeParse(email).success) {
      setErrors({ email: texts.auth.validation.invalidEmail });
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (error) {
      setFormError(error);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setSent(false);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(nextOpen) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold tracking-tight">{texts.auth.forgot.title}</DialogTitle>
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
            {formError && <ErrorBanner error={formError} />}
            <Button type="submit" className="w-full gap-2 rounded-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <>{texts.auth.forgot.sendLink} </><ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
