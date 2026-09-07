import { type FormEvent, useState } from "react";

import { texts } from "@/texts";

import { forgotPassword } from "@/lib/api/auth/forgot-password";
import { emailSchema } from "@/lib/validation/email-schema";

export function useForgotPasswordSubmission() {
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

  return {
    errors,
    formError,
    loading,
    sent,
    submit,
    reset: () => {
      setSent(false);
      setErrors({});
    },
  };
}
