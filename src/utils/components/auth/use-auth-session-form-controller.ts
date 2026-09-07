import { type FormEvent, useState } from "react";

import type { ZodType } from "zod";

import type { AuthResponse } from "@/types/application/auth/auth-response";
import { getZodFieldErrors } from "@/utils/get-zod-field-errors";

import { clearAuthSession } from "@/lib/auth-session/clear-auth-session";
import { persistAuthSession } from "@/lib/auth-session/persist-auth-session";

export function useAuthSessionFormController<TInput>(
  schema: ZodType<TInput>,
  authenticate: (data: TInput) => Promise<AuthResponse>,
  onDone: () => void,
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setErrors(getZodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    clearAuthSession();

    try {
      const result = await authenticate(parsed.data);
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
