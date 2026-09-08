import { signup } from "@/lib/api/auth/signup";
import { signupSchema } from "@/lib/validation/signup-schema";

import { useAuthSessionFormController } from "@/utils/components/auth/use-auth-session-form-controller";

export function useSignupFormController() {
  return useAuthSessionFormController(signupSchema, signup);
}
