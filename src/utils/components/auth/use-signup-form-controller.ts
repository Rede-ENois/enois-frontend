import { useAuthSessionFormController } from "@/utils/components/auth/use-auth-session-form-controller";

import { signup } from "@/lib/api/auth/signup";
import { signupSchema } from "@/lib/validation/signup-schema";

export function useSignupFormController() {
  return useAuthSessionFormController(signupSchema, signup);
}
