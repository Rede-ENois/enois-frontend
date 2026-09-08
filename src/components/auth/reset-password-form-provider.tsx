import { ResetPasswordFormContext } from "@/utils/auth/reset-password-form-context";
import { useResetPasswordFormController } from "@/utils/auth/use-reset-password-form-controller";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export function ResetPasswordFormProvider() {
  const controller = useResetPasswordFormController();

  return (
    <ResetPasswordFormContext.Provider value={controller}>
      <ResetPasswordForm />
    </ResetPasswordFormContext.Provider>
  );
}
