import { useAuthSessionFormController } from "@/utils/auth/use-auth-session-form-controller";

import { signup } from "@/lib/auth/api/signup";
import { signupSchema } from "@/lib/auth/validation/signup-schema";

export function useSignupFormController() {
  return useAuthSessionFormController(signupSchema, signup);
}
