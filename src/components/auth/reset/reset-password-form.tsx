import type { FormEventHandler } from "react";

import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetPasswordFormProps = {
  errors: Record<string, string>;
  isSubmitting: boolean;
  isPasswordVisible: boolean;
  onTogglePassword: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ResetPasswordForm({
  errors,
  isSubmitting,
  isPasswordVisible,
  onTogglePassword,
  onSubmit,
}: ResetPasswordFormProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{texts.auth.reset.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{texts.auth.reset.description}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{texts.auth.fields.newPassword}</Label>
          <div className="relative">
            <Input
              name="password"
              type={isPasswordVisible ? "text" : "password"}
              placeholder={texts.auth.placeholders.newPassword}
              autoComplete="new-password"
              required
              maxLength={128}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
              aria-label={isPasswordVisible ? texts.auth.password.hide : texts.auth.password.show}
            >
              {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        {errors.form && (
          <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{errors.form}</p>
        )}
        <Button type="submit" className="w-full gap-2 rounded-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{texts.auth.reset.action} <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        {texts.auth.reset.remembered}{" "}
        <Link to="/entrar" search={{ tab: "login" }} className="text-primary hover:underline">
          {texts.common.enter}
        </Link>
      </p>
    </div>
  );
}
