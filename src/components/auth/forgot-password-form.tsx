import { texts } from "@/texts";
import type { ForgotPasswordFormProps } from "@/types/components/auth/forgot-password-form-props";

import { Input } from "@/components/ui/input";

import { ErrorBanner } from "@/components/error-banner";
import { FormField } from "@/components/form-field";

import { AuthSubmitButton } from "./auth-submit-button";

export function ForgotPasswordForm({
  errors,
  formError,
  loading,
  submit,
}: ForgotPasswordFormProps) {
  return (
    <form onSubmit={submit} className="space-y-4 pb-2 pt-2" noValidate>
      <p className="text-sm text-muted-foreground">{texts.auth.forgot.description}</p>

      <FormField label={texts.auth.fields.email} error={errors.email}>
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
