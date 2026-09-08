import { type FormEvent, useState } from "react";

import { useForgotPasswordStore } from "@/stores/forgot-password.store";
import { texts } from "@/texts";

import { emailSchema } from "@/lib/validation/email-schema";

export function useForgotPasswordFormController() {
  const [emailError, setEmailError] = useState<string>();
  const loading = useForgotPasswordStore((state) => state.loading);
  const formError = useForgotPasswordStore((state) => state.formError);
  const submitEmail = useForgotPasswordStore((state) => state.submit);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    if (!emailSchema.safeParse(email).success) {
      setEmailError(texts.auth.validation.invalidEmail);
      return;
    }

    setEmailError(undefined);
    await submitEmail(email);
  };

  return { emailError, formError, loading, submit };
}
