import { useState } from "react";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { Sparkles } from "lucide-react";
import { z } from "zod";

import { texts } from "@/texts";
import type { TabBtnProps } from "@/types/routes/auth/tab-btn-props";

import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div
          aria-hidden
          className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl"
        />

        <Link to="/" className="relative flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/20 backdrop-blur">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            <>{texts.brand.prefix}</><span className="gradient-text">{texts.brand.accent}</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-sm font-medium uppercase tracking-wider text-primary-foreground/80">
            {texts.auth.hero.eyebrow}
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            {texts.auth.hero.quote}
          </h2>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/25" />
            <div>
              <p className="font-medium">{texts.auth.hero.person}</p>
              <p className="text-sm text-primary-foreground/75">{texts.auth.hero.role}</p>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-4 text-sm">
          {texts.auth.hero.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-primary-foreground/75">{stat.label}</p>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex flex-col px-6 py-10 sm:px-12">
        <div className="flex items-center justify-between lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">
              <>{texts.brand.prefix}</><span className="gradient-text">{texts.brand.accent}</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
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
        </div>
      </section>
    </div>
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
