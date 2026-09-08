import { type FormEvent, useState } from "react";

import { useForgotPasswordStore } from "@/stores/auth/forgot-password.store";
import { texts } from "@/texts";

import { forgotPassword } from "@/lib/auth/api/forgot-password";
import { emailSchema } from "@/lib/auth/validation/email-schema";

export function useForgotPasswordFormController() {
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const setSent = useForgotPasswordStore((state) => state.setSent);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    if (!emailSchema.safeParse(email).success) {
      setEmailError(texts.auth.validation.invalidEmail);
      return;
    }

    setEmailError(undefined);
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

  return { emailError, formError, loading, submit };
}
