import { useSearch } from "@tanstack/react-router";

import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { ResetPasswordFormProvider } from "@/components/auth/reset-password-form-provider";

export function ResetPassword() {
  const token = useSearch({ from: "/auth/reset" }).token ?? "";

  return (
    <AuthPageLayout>
      <ResetPasswordFormProvider token={token} />
    </AuthPageLayout>
  );
}
