import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { ResetPasswordFormProvider } from "@/components/auth/reset-password-form-provider";

export function ResetPassword() {
  return (
    <AuthPageLayout>
      <ResetPasswordFormProvider />
    </AuthPageLayout>
  );
}
