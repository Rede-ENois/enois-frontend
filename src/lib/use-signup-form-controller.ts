import { type FormEvent, useState } from "react";

import type { AuthFormProps } from "@/types/routes/auth/auth-form-props";
import { getZodFieldErrors } from "@/utils/get-zod-field-errors";

import { signup } from "@/lib/api/auth/signup";
import { clearAuthSession } from "@/lib/auth-session/clear-auth-session";
import { persistAuthSession } from "@/lib/auth-session/persist-auth-session";
import { signupSchema } from "@/lib/validation/signup-schema";

export function useSignupFormController(onDone: AuthFormProps["onDone"]) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = signupSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setErrors(getZodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    clearAuthSession();

    try {
      const result = await signup(parsed.data);
      persistAuthSession(result);
      onDone();
    } catch (error) {
      setFormError(error);
    } finally {
      setLoading(false);
    }
  };

  return { errors, formError, loading, submit };
}
