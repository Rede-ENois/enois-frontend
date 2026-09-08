import { type FormEvent, useState } from "react";

import { texts } from "@/texts";
import { getZodFieldErrors } from "@/utils/get-zod-field-errors";

import { ApiError } from "@/lib/api-client";
import { resetPassword } from "@/lib/auth/api/reset-password";
import { resetPasswordSchema } from "@/lib/auth/validation/reset-password-schema";

export function useResetPasswordSubmission(token: string) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = resetPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setErrors(getZodFieldErrors(parsed.error));
      return;
    }
    if (!token) {
      setErrors({ form: texts.auth.reset.invalidLink });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await resetPassword(token, parsed.data.password);
      setDone(true);
    } catch (error) {
      setErrors({
        form: error instanceof ApiError ? error.message : texts.errors.unexpected,
      });
    } finally {
      setLoading(false);
    }
  };

  return { errors, loading, done, submit };
}
