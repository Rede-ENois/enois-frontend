import { useSearch } from "@tanstack/react-router";

import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export function ResetPassword() {
  const token = useSearch({ from: "/auth/reset" }).token ?? "";

  return (
    <AuthPageLayout>
      <ResetPasswordForm token={token} />
    </AuthPageLayout>
  );
}
