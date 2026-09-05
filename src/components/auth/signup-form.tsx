import { type FormEvent, useState } from "react";

import { ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";

import { authApi } from "@/lib/api";
import { texts } from "@/texts";
import { mapValidationErrors } from "@/utils/forms";
import { clearSession, storeAuthenticatedSession } from "@/utils/session";

import { ErrorBanner } from "@/components/error-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Divider } from "./controls/divider";
import { Field } from "./controls/field";
import { PasswordVisibilityButton } from "./controls/password-visibility-button";
import { SocialButtons } from "./controls/social-buttons";

const signupSchema = z.object({
  name: z.string().trim().min(2, texts.auth.validation.signupNameMin).max(80),
  email: z.string().trim().email(texts.auth.validation.invalidEmail).max(255),
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});

export function SignupForm({ onDone }: { onDone: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = signupSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (!parsed.success) {
      setErrors(mapValidationErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    clearSession();

    try {
      const result = await authApi.signup(parsed.data);
      storeAuthenticatedSession(result);
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
        <SocialButtons />
        <Divider />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={texts.auth.fields.fullName} error={errors.name}>
          <Input name="name" placeholder={texts.auth.placeholders.name} autoComplete="name" required maxLength={80} />
        </Field>
        <Field label={texts.auth.fields.email} error={errors.email}>
          <Input name="email" type="email" placeholder={texts.auth.placeholders.email} autoComplete="email" required maxLength={255} />
        </Field>
        <Field label={texts.auth.fields.password} error={errors.password}>
          <div className="relative">
            <Input
              name="password"
              type={show ? "text" : "password"}
              placeholder={texts.auth.placeholders.newPassword}
              autoComplete="new-password"
              required
              maxLength={128}
            />
            <PasswordVisibilityButton show={show} onToggle={() => setShow((value) => !value)} />
          </div>
        </Field>

        {formError && <ErrorBanner error={formError} />}
        <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{texts.common.createAccount} <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
    </div>
  );
}
