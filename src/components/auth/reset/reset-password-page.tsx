import { useNavigate } from "@tanstack/react-router";

import { AuthHeroPanel } from "@/components/auth/layout/auth-hero-panel";
import { AuthMobileHeader } from "@/components/auth/layout/auth-mobile-header";

import { ResetPasswordForm } from "./reset-password-form";
import { ResetPasswordSuccess } from "./reset-password-success";
import { useResetPassword } from "./use-reset-password";

export function ResetPasswordPage({ token }: { token: string }) {
  const navigate = useNavigate();
  const reset = useResetPassword(token);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthHeroPanel />
      <section className="flex flex-col px-6 py-10 sm:px-12">
        <AuthMobileHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {reset.done ? (
            <ResetPasswordSuccess
              onContinue={() => navigate({ to: "/entrar", search: { tab: "login" } })}
            />
          ) : (
            <ResetPasswordForm
              errors={reset.errors}
              loading={reset.loading}
              showPassword={reset.showPassword}
              onTogglePassword={reset.togglePassword}
              onSubmit={reset.submit}
            />
          )}
        </div>
      </section>
    </div>
  );
}
