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
import { AuthDivider } from "./controls/auth-divider";
import { AuthField } from "./controls/auth-field";
import { AuthSocialButtons } from "./controls/auth-social-buttons";
import { PasswordVisibilityButton } from "./controls/password-visibility-button";

const signUpSchema = z.object({
  name: z.string().trim().min(2, texts.auth.validation.signupNameMin).max(80),
  email: z.string().trim().email(texts.auth.validation.invalidEmail).max(255),
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});

type SignUpFormProps = {
  onAuthenticated: () => void;
};

export function SignUpForm({ onAuthenticated }: SignUpFormProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (!parsed.success) {
      setValidationErrors(mapValidationErrors(parsed.error.issues));
      return;
    }

    setValidationErrors({});
    setFormError(null);
    setIsSubmitting(true);
    clearSession();

    try {
      const authResponse = await authApi.signUp(parsed.data);
      storeAuthenticatedSession(authResponse);
      onAuthenticated();
    } catch (error) {
      setFormError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{texts.auth.signup.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{texts.auth.signup.subtitle}</p>

      <div className="mt-6">
        <AuthSocialButtons />
        <AuthDivider />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField label={texts.auth.fields.fullName} error={validationErrors.name}>
          <Input name="name" placeholder={texts.auth.placeholders.name} autoComplete="name" required maxLength={80} />
        </AuthField>
        <AuthField label={texts.auth.fields.email} error={validationErrors.email}>
          <Input name="email" type="email" placeholder={texts.auth.placeholders.email} autoComplete="email" required maxLength={255} />
        </AuthField>
        <AuthField label={texts.auth.fields.password} error={validationErrors.password}>
          <div className="relative">
            <Input
              name="password"
              type={isPasswordVisible ? "text" : "password"}
              placeholder={texts.auth.placeholders.newPassword}
              autoComplete="new-password"
              required
              maxLength={128}
            />
            <PasswordVisibilityButton
              isVisible={isPasswordVisible}
              onToggle={() => setIsPasswordVisible((isVisible) => !isVisible)}
            />
          </div>
        </AuthField>

        {formError && <ErrorBanner error={formError} />}
        <Button type="submit" className="w-full rounded-full gap-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{texts.common.createAccount} <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
    </div>
  );
}
