import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import type { AuthResponse } from "@/types/application/auth/auth-response";

import { clearAuthSession } from "@/lib/auth-session/clear-auth-session";
import { persistAuthSession } from "@/lib/auth-session/persist-auth-session";

export function useAuthSessionSubmission<TInput>(
  authenticate: (data: TInput) => Promise<AuthResponse>,
) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (data: TInput) => {
    setFormError(null);
    setLoading(true);
    clearAuthSession();

    try {
      const result = await authenticate(data);
      persistAuthSession(result);
      void navigate({ to: "/feed" });
    } catch (error) {
      setFormError(error);
    } finally {
      setLoading(false);
    }
  };

  return { formError, loading, submit };
}
