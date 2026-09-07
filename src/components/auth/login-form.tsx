import { texts } from "@/texts";
import type { LoginFormProps } from "@/types/routes/auth/login-form-props";
import { ArrowRight, Loader2 } from "lucide-react";

import { useLoginFormController } from "@/utils/components/auth/use-login-form-controller";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ErrorBanner } from "@/components/error-banner";
import { FormField } from "@/components/form-field";

import { AuthPasswordInput } from "./auth-password-input";
import { AuthSocialOptions } from "./auth-social-options";

export function LoginForm({ onDone, onForgot }: LoginFormProps) {
  const { errors, formError, loading, submit } = useLoginFormController(onDone);
  const fields = [
    {
      key: "email",
      label: texts.auth.fields.email,
      error: errors.email,
      right: undefined,
      control: (
        <Input
          name="email"
          type="email"
          placeholder={texts.auth.placeholders.email}
          autoComplete="email"
          required
          maxLength={255}
        />
      ),
    },
    {
      key: "password",
      label: texts.auth.fields.password,
      error: errors.password,
      right: (
        <button
          type="button"
          onClick={onForgot}
          className="text-xs font-medium text-primary hover:underline"
        >
          {texts.auth.password.forgot}
        </button>
      ),
      control: (
        <AuthPasswordInput
          name="password"
          placeholder={texts.auth.placeholders.password}
          autoComplete="current-password"
          required
          maxLength={128}
        />
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{texts.auth.login.title}</h1>

      <p className="mt-1 text-sm text-muted-foreground">{texts.auth.login.subtitle}</p>

      <div className="mt-6">
        <AuthSocialOptions />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {fields.map((field) => (
          <FormField
            key={field.key}
            label={field.label}
            error={field.error}
            right={field.right}
          >
            {field.control}
          </FormField>
        ))}

        {formError !== null && <ErrorBanner error={formError} />}
        <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <>{texts.common.enter} </>

              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
