import type { LoginFormProps } from "@/types/routes/auth/login-form-props";

import { login } from "@/lib/api/auth";
import { loginSchema } from "@/lib/validation/login-schema";

import { useAuthSessionFormController } from "@/utils/components/auth/use-auth-session-form-controller";

export function useLoginFormController(onDone: LoginFormProps["onDone"]) {
  return useAuthSessionFormController(loginSchema, login, onDone);
}
