import { createContext } from "react";

import type { useSignupFormController } from "@/utils/auth/use-signup-form-controller";

export const SignupFormContext = createContext<ReturnType<typeof useSignupFormController> | null>(
  null,
);
