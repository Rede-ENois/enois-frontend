import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { useResetPasswordFormContext } from "@/utils/auth/use-reset-password-form-context";

import { FormField } from "@/components/form-field";

import { AuthFormHeading } from "./auth-form-heading";
import { AuthPasswordInput } from "./auth-password-input";
import { AuthSubmitButton } from "./auth-submit-button";

export function ResetPasswordContent() {
  const { errors, loading, submit } = useResetPasswordFormContext();

  return (
    <div>
      <AuthFormHeading title={texts.auth.reset.title} subtitle={texts.auth.reset.description} />

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <FormField label={texts.auth.fields.newPassword} error={errors.password}>
          <AuthPasswordInput
            name="password"
            placeholder={texts.auth.placeholders.newPassword}
            autoComplete="new-password"
            required
            maxLength={128}
          />
        </FormField>

        {errors.form && (
          <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {errors.form}
          </p>
        )}

        <AuthSubmitButton loading={loading} label={texts.auth.reset.action} />
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <>{texts.auth.reset.remembered}</>

        <Link to="/entrar" search={{ tab: "login" }} className="text-primary hover:underline">
          {texts.common.enter}
        </Link>
      </p>
    </div>
  );
}
