import { useSearch } from "@tanstack/react-router";

import { LoginFormProvider } from "@/components/auth/login-form-provider";
import { SignupFormProvider } from "@/components/auth/signup-form-provider";

export function AuthFormPanel() {
  const { tab } = useSearch({ from: "/entrar" });

  return <div className="mt-8">{tab === "signup" ? <SignupFormProvider /> : <LoginFormProvider />}</div>;
}
