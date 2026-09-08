import type { ResetPasswordFormProps } from "@/types/components/auth/reset-password-form-props";

import { useResetPasswordFormController } from "@/utils/components/auth/use-reset-password-form-controller";

import { ResetPasswordContent } from "./reset-password-content";
import { ResetPasswordSuccess } from "./reset-password-success";

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const controller = useResetPasswordFormController(token);

  if (controller.done) {
    return <ResetPasswordSuccess onLogin={controller.goToLogin} />;
  }

  return (
    <ResetPasswordContent
      errors={controller.errors}
      loading={controller.loading}
      submit={controller.submit}
    />
  );
}
