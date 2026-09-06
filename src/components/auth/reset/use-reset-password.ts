import { type FormEvent, useState } from "react";

import { z } from "zod";

import { ApiError, authApi } from "@/lib/api";
import { texts } from "@/texts";

const resetSchema = z.object({
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});

export function useResetPassword(token: string) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = resetSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const nextValidationErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        nextValidationErrors[issue.path[0] as string] = issue.message;
      }
      setValidationErrors(nextValidationErrors);
      return;
    }
    if (!token) {
      setValidationErrors({ form: texts.auth.reset.invalidLink });
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, parsed.data.password);
      setIsResetComplete(true);
    } catch (error) {
      setValidationErrors({
        form: error instanceof ApiError ? error.message : texts.errors.unexpected,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    validationErrors,
    isSubmitting,
    isPasswordVisible,
    isResetComplete,
    handleSubmit,
    handleTogglePassword: () => setIsPasswordVisible((isVisible) => !isVisible),
  };
}
