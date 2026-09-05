import { type FormEvent, useState } from "react";

import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";

import { authApi } from "@/lib/api";
import { texts } from "@/texts";

import { ErrorBanner } from "@/components/error-banner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

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
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(value) : close())}>
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
                <p className="mt-1 text-[13px] text-muted-foreground">{texts.auth.forgot.sentDescription}</p>
              </div>
            </div>
            <Button className="w-full rounded-full" onClick={close}>{texts.auth.forgot.understood}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 pb-2 pt-2" noValidate>
            <p className="text-sm text-muted-foreground">{texts.auth.forgot.description}</p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{texts.auth.fields.email}</Label>
              <Input name="email" type="email" placeholder={texts.auth.placeholders.email} autoComplete="email" required maxLength={255} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            {formError && <ErrorBanner error={formError} />}
            <Button type="submit" className="w-full gap-2 rounded-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{texts.auth.forgot.sendLink} <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
