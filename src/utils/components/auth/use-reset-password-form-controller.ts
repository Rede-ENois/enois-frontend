import { type FormEvent, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ResetPasswordFormProps } from "@/types/components/auth/reset-password-form-props";
import { getZodFieldErrors } from "@/utils/get-zod-field-errors";

import { ApiError } from "@/lib/api-client";
import { resetPassword } from "@/lib/api/auth/reset-password";
import { resetPasswordSchema } from "@/lib/validation/reset-password-schema";

export function useResetPasswordFormController(token: ResetPasswordFormProps["token"]) {
  const navigate = useNavigate();
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

  const goToLogin = () => navigate({ to: "/entrar", search: { tab: "login" } });

  return { errors, loading, done, submit, goToLogin };
}
