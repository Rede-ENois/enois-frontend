import { useContext } from "react";

import { SignupFormContext } from "@/utils/auth/signup-form-context";

export function useSignupFormContext() {
  const context = useContext(SignupFormContext);

  if (!context) {
    throw new Error("Signup form components must be rendered inside SignupFormProvider");
  }

  return context;
}
