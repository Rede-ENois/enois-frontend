import { texts } from "@/texts";
import { useForgotPasswordFormController } from "@/utils/auth/use-forgot-password-form-controller";

import { Input } from "@/components/ui/input";

import { ErrorBanner } from "@/components/error-banner";
import { FormField } from "@/components/form-field";

import { AuthSubmitButton } from "./auth-submit-button";

export function ForgotPasswordForm() {
  const { emailError, formError, loading, submit } = useForgotPasswordFormController();

  return (
    <form onSubmit={submit} className="space-y-4 pb-2 pt-2" noValidate>
      <p className="text-sm text-muted-foreground">{texts.auth.forgot.description}</p>

      <FormField label={texts.auth.fields.email} error={emailError}>
        <Input
          name="email"
          type="email"
          placeholder={texts.auth.placeholders.email}
          autoComplete="email"
          required
          maxLength={255}
        />
      </FormField>

      {formError !== null && <ErrorBanner error={formError} />}
      <AuthSubmitButton loading={loading} label={texts.auth.forgot.sendLink} />
    </form>
  );
}
