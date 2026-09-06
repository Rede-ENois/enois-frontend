import { useState } from "react";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { z } from "zod";

import { texts } from "@/texts";
import type { TabBtnProps } from "@/types/routes/auth/tab-btn-props";

import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

const searchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional().default("signup"),
});

export const Route = createFileRoute("/entrar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: texts.auth.seo.authTitle },
      {
        name: "description",
        content: texts.auth.seo.authDescription,
      },
    ],
  }),
  component: Auth,
});

function Auth() {
  const initial = Route.useSearch().tab;
  const navigate = useNavigate();
  const [tab, setTab] = useState(initial);
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <AuthPageLayout showThemeToggle>
      <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
        <TabBtn active={tab === "signup"} onClick={() => setTab("signup")}>
          {texts.common.createAccount}
        </TabBtn>
        <TabBtn active={tab === "login"} onClick={() => setTab("login")}>
          {texts.common.enter}
        </TabBtn>
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

function TabBtn({ active, children, onClick }: TabBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
