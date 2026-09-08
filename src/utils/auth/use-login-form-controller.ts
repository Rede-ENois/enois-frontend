import { useAuthSessionFormController } from "@/utils/auth/use-auth-session-form-controller";

import { login } from "@/lib/auth/api/auth";
import { loginSchema } from "@/lib/auth/validation/login-schema";

export function useLoginFormController() {
  return useAuthSessionFormController(loginSchema, login);
}
