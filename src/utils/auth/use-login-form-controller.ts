import { useAuthSessionFormController } from "@/utils/auth/use-auth-session-form-controller";

import { login } from "@/lib/api/auth";
import { loginSchema } from "@/lib/validation/login-schema";

export function useLoginFormController() {
  return useAuthSessionFormController(loginSchema, login);
}
