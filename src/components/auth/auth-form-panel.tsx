import { useSearch } from "@tanstack/react-router";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

export function AuthFormPanel() {
  const { tab } = useSearch({ from: "/entrar" });

  return <div className="mt-8">{tab === "signup" ? <SignupForm /> : <LoginForm />}</div>;
}
