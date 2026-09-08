import { useContext } from "react";

import { LoginFormContext } from "@/utils/components/auth/login-form-context";

export function useLoginFormContext() {
  const context = useContext(LoginFormContext);

  if (!context) {
    throw new Error("Login form components must be rendered inside LoginFormProvider");
  }

  return context;
}
