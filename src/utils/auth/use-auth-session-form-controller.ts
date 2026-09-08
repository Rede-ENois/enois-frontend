import { type FormEvent, useState } from "react";

import type { AuthResponse } from "@/types/auth/auth-response";
import { useAuthSessionSubmission } from "@/utils/auth/use-auth-session-submission";
import { getZodFieldErrors } from "@/utils/get-zod-field-errors";
import type { ZodType } from "zod";

export function useAuthSessionFormController<TInput>(
  schema: ZodType<TInput>,
  authenticate: (data: TInput) => Promise<AuthResponse>,
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submission = useAuthSessionSubmission(authenticate);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setErrors(getZodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    await submission.submit(parsed.data);
  };

  return {
    errors,
    formError: submission.formError,
    loading: submission.loading,
    submit,
  };
}
