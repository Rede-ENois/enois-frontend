import { useState } from "react";

import { Link, useNavigate, useSearch } from "@tanstack/react-router";

import { texts } from "@/texts";

import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { TabButton } from "@/components/tab-button";

export function Auth() {
  const initial = useSearch({ from: "/entrar" }).tab;
  const navigate = useNavigate();
  const [tab, setTab] = useState(initial);
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <AuthPageLayout showThemeToggle>
      <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
        <TabButton variant="auth" active={tab === "signup"} onClick={() => setTab("signup")}>
          {texts.common.createAccount}
        </TabButton>
        <TabButton variant="auth" active={tab === "login"} onClick={() => setTab("login")}>
          {texts.common.enter}
        </TabButton>
      </div>

      <div className="mt-8">
        {tab === "signup" ? (
          <SignupForm onDone={() => navigate({ to: "/feed" })} />
        ) : (
          <LoginForm
            onDone={() => navigate({ to: "/feed" })}
            onForgot={() => setForgotOpen(true)}
          />
        )}
      </div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <>{texts.auth.terms.prefix}</><Link to="/termos" className="text-primary hover:underline">
          {texts.auth.terms.terms}
        </Link><>{texts.auth.terms.conjunction}</><Link to="/privacidade" className="text-primary hover:underline">
          {texts.auth.terms.privacy}
        </Link><>{texts.auth.terms.end}</>
      </p>
    </AuthPageLayout>
  );
}
