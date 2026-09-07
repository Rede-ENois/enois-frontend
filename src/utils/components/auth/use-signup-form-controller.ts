import type { AuthFormProps } from "@/types/routes/auth/auth-form-props";

import { signup } from "@/lib/api/auth/signup";
import { signupSchema } from "@/lib/validation/signup-schema";

import { useAuthSessionFormController } from "@/utils/components/auth/use-auth-session-form-controller";

export function useSignupFormController(onDone: AuthFormProps["onDone"]) {
  return useAuthSessionFormController(signupSchema, signup, onDone);
}
