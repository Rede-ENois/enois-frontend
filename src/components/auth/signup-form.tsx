import { type FormEvent, useState } from "react";

import { ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";

import { authApi } from "@/lib/api/auth";
import { clearAuthSession, persistAuthSession } from "@/lib/auth-session";
import { texts } from "@/texts";
import type { AuthFormProps } from "@/types/routes/auth/auth-form-props";

import { ErrorBanner } from "@/components/error-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthField } from "./auth-field";
import { AuthPasswordInput } from "./auth-password-input";
import { AuthSocialOptions } from "./auth-social-options";

const signupSchema = z.object({
  name: z.string().trim().min(2, texts.auth.validation.signupNameMin).max(80),
  email: z.string().trim().email(texts.auth.validation.invalidEmail).max(255),
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});

export function SignupForm({ onDone }: AuthFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = signupSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as string] = issue.message;
      setErrors(next);
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    clearAuthSession();

    try {
      const result = await authApi.signup(parsed.data);
      persistAuthSession(result);
      onDone();
    } catch (error) {
      setFormError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{texts.auth.signup.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{texts.auth.signup.subtitle}</p>

      <div className="mt-6">
        <AuthSocialOptions />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthField label={texts.auth.fields.fullName} error={errors.name}>
          <Input
            name="name"
            placeholder={texts.auth.placeholders.name}
            autoComplete="name"
            required
            maxLength={80}
          />
        </AuthField>
        <AuthField label={texts.auth.fields.email} error={errors.email}>
          <Input
            name="email"
            type="email"
            placeholder={texts.auth.placeholders.email}
            autoComplete="email"
            required
            maxLength={255}
          />
        </AuthField>
        <AuthField label={texts.auth.fields.password} error={errors.password}>
          <AuthPasswordInput
            name="password"
            placeholder={texts.auth.placeholders.newPassword}
            autoComplete="new-password"
            required
            maxLength={128}
          />
        </AuthField>

        {formError && <ErrorBanner error={formError} />}
        <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <>{texts.common.createAccount} </><ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
