import { ResetPasswordFormContext } from "@/utils/components/auth/reset-password-form-context";
import { useResetPasswordFormController } from "@/utils/components/auth/use-reset-password-form-controller";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export function ResetPasswordFormProvider() {
  const controller = useResetPasswordFormController();

  return (
    <ResetPasswordFormContext.Provider value={controller}>
      <ResetPasswordForm />
    </ResetPasswordFormContext.Provider>
  );
}
