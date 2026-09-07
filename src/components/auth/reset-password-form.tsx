import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ResetPasswordFormProps } from "@/types/components/auth/reset-password-form-props";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { useResetPasswordFormController } from "@/lib/use-reset-password-form-controller";

import { Button } from "@/components/ui/button";

import { FormField } from "@/components/form-field";

import { AuthPasswordInput } from "./auth-password-input";

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { errors, loading, done, submit, goToLogin } = useResetPasswordFormController(token);

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {texts.auth.reset.successTitle}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">{texts.auth.reset.successDescription}</p>

        <Button className="mt-6 w-full gap-2 rounded-full" onClick={goToLogin}>
          <>{texts.auth.reset.enterNow}</>

          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{texts.auth.reset.title}</h1>

      <p className="mt-1 text-sm text-muted-foreground">{texts.auth.reset.description}</p>

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
        <Button type="submit" className="w-full gap-2 rounded-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <>{texts.auth.reset.action}</>

              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
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
