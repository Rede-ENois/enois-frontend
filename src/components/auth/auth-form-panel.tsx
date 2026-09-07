import type { AuthFormPanelProps } from "@/types/components/auth/auth-form-panel-props";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

export function AuthFormPanel({ showSignup, onDone, onForgot }: AuthFormPanelProps) {
  return (
    <div className="mt-8">
      {showSignup ? (
        <SignupForm onDone={onDone} />
      ) : (
        <LoginForm onDone={onDone} onForgot={onForgot} />
      )}
    </div>
  );
}
