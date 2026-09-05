import { type FormEvent, useState } from "react";

import { z } from "zod";

import { ApiError, authApi } from "@/lib/api";
import { texts } from "@/texts";

const resetSchema = z.object({
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});

export function useResetPassword(token: string) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = resetSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as string] = issue.message;
      setErrors(next);
      return;
    }
    if (!token) {
      setErrors({ form: texts.auth.reset.invalidLink });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await authApi.resetPassword(token, parsed.data.password);
      setDone(true);
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : texts.errors.unexpected });
    } finally {
      setLoading(false);
    }
  };

  return {
    errors,
    loading,
    showPassword,
    done,
    submit,
    togglePassword: () => setShowPassword((value) => !value),
  };
}
