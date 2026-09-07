import { type FormEvent, useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";

import { resetPassword } from "@/lib/api/auth/reset-password";
import { ApiError } from "@/lib/api-client";
import { texts } from "@/texts";
import type { ResetPasswordFormProps } from "@/types/components/auth/reset-password-form-props";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

import { AuthPasswordInput } from "./auth-password-input";

const resetSchema = z.object({
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = resetSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as string] = issue.message;
      setErrors(next);
      return;
    }
    if (!token) {
      setErrors({ form: texts.auth.reset.invalidLink });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await resetPassword(token, parsed.data.password);
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: texts.errors.unexpected });
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{texts.auth.reset.successTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{texts.auth.reset.successDescription}</p>
        <Button
          className="mt-6 w-full gap-2 rounded-full"
          onClick={() => navigate({ to: "/entrar", search: { tab: "login" } })}
        >
          <>{texts.auth.reset.enterNow}</><ArrowRight className="h-4 w-4" />
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
              <>{texts.auth.reset.action}</><ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <>{texts.auth.reset.remembered}</><Link
          to="/entrar"
          search={{ tab: "login" }}
          className="text-primary hover:underline"
        >
          {texts.common.enter}
        </Link>
      </p>
    </div>
  );
}
