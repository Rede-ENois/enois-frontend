import { texts } from "@/texts";
import type { AuthFormProps } from "@/types/routes/auth/auth-form-props";
import { ArrowRight, Loader2 } from "lucide-react";

import { useSignupFormController } from "@/utils/components/auth/use-signup-form-controller";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ErrorBanner } from "@/components/error-banner";
import { FormField } from "@/components/form-field";

import { AuthPasswordInput } from "./auth-password-input";
import { AuthSocialOptions } from "./auth-social-options";

export function SignupForm({ onDone }: AuthFormProps) {
  const { errors, formError, loading, submit } = useSignupFormController(onDone);
  const fields = [
    {
      key: "name",
      label: texts.auth.fields.fullName,
      error: errors.name,
      control: (
        <Input
          name="name"
          placeholder={texts.auth.placeholders.name}
          autoComplete="name"
          required
          maxLength={80}
        />
      ),
    },
    {
      key: "email",
      label: texts.auth.fields.email,
      error: errors.email,
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
      control: (
        <AuthPasswordInput
          name="password"
          placeholder={texts.auth.placeholders.newPassword}
          autoComplete="new-password"
          required
          maxLength={128}
        />
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{texts.auth.signup.title}</h1>

      <p className="mt-1 text-sm text-muted-foreground">{texts.auth.signup.subtitle}</p>

      <div className="mt-6">
        <AuthSocialOptions />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {fields.map((field) => (
          <FormField key={field.key} label={field.label} error={field.error}>
            {field.control}
          </FormField>
        ))}

        {formError !== null && <ErrorBanner error={formError} />}
        <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <>{texts.common.createAccount} </>

              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
