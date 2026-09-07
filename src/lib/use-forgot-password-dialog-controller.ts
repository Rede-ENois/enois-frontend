import { type FormEvent, useState } from "react";

import { forgotPassword } from "@/lib/api/auth/forgot-password";
import { emailSchema } from "@/lib/validation/email-schema";
import { texts } from "@/texts";
import type { ForgotPasswordDialogProps } from "@/types/routes/auth/forgot-password-dialog-props";

export function useForgotPasswordDialogController(
  onOpenChange: ForgotPasswordDialogProps["onOpenChange"],
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!emailSchema.safeParse(email).success) {
      setErrors({ email: texts.auth.validation.invalidEmail });
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
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

  const handleOpenChange = (open: boolean) => {
    if (open) onOpenChange(true);
    else close();
  };

  return { errors, formError, loading, sent, submit, close, handleOpenChange };
}
