import { type FormEvent, useState } from "react";

import { login } from "@/lib/api/auth";
import { clearAuthSession } from "@/lib/auth-session/clear-auth-session";
import { persistAuthSession } from "@/lib/auth-session/persist-auth-session";
import { loginSchema } from "@/lib/validation/login-schema";
import type { LoginFormProps } from "@/types/routes/auth/login-form-props";
import { getZodFieldErrors } from "@/utils/get-zod-field-errors";

export function useLoginFormController(onDone: LoginFormProps["onDone"]) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setErrors(getZodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    clearAuthSession();

    try {
      const result = await login(parsed.data);
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
