import { useNavigate } from "@tanstack/react-router";

import { AuthHeroPanel } from "@/components/auth/layout/auth-hero-panel";
import type { ResetPasswordPageProps } from "@/types/components/auth/reset-password-page-props";
import { ResetMobileHeader } from "./reset-mobile-header";
import { ResetPasswordForm } from "./reset-password-form";
import { ResetPasswordSuccess } from "./reset-password-success";
import { useResetPassword } from "./use-reset-password";

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const navigate = useNavigate();
  const resetPassword = useResetPassword(token);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthHeroPanel />
      <section className="flex flex-col px-6 py-10 sm:px-12">
        <ResetMobileHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {resetPassword.isResetComplete ? (
            <ResetPasswordSuccess
              onContinue={() => navigate({ to: "/entrar", search: { tab: "login" } })}
            />
          ) : (
            <ResetPasswordForm
              errors={resetPassword.validationErrors}
              isSubmitting={resetPassword.isSubmitting}
              isPasswordVisible={resetPassword.isPasswordVisible}
              onTogglePassword={resetPassword.handleTogglePassword}
              onSubmit={resetPassword.handleSubmit}
            />
          )}
        </div>
      </section>
    </div>
  );
}
