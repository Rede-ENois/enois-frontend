import { type FormEvent, useState } from "react";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { ArrowRight, Eye, EyeOff, Loader2, MailCheck, Sparkles } from "lucide-react";
import { z } from "zod";

import { authApi } from "@/lib/api";
import { texts } from "@/texts";
import { mapValidationErrors } from "@/utils/forms";
import { clearSession, storeAuthenticatedSession } from "@/utils/session";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ErrorBanner } from "@/components/error-banner";
import { ThemeToggle } from "@/components/theme-toggle";

type Tab = "login" | "signup";
type OAuthProvider = "GOOGLE" | "APPLE";

const searchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional().default("signup"),
});

const loginSchema = z.object({
  email: z.string().trim().email(texts.auth.validation.invalidEmail).max(255),
  password: z.string().min(6, texts.auth.validation.loginPasswordMin).max(128),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, texts.auth.validation.signupNameMin).max(80),
  email: z.string().trim().email(texts.auth.validation.invalidEmail).max(255),
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
});

const oauthProviders: Record<
  OAuthProvider,
  { name: string; label: string; Icon: React.ElementType }
> = {
  GOOGLE: { name: "Google", label: texts.auth.social.google, Icon: GoogleIcon },
  APPLE: { name: "Apple", label: texts.auth.social.apple, Icon: AppleIcon },
};

export const Route = createFileRoute("/entrar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: texts.auth.seo.authTitle },
      { name: "description", content: texts.auth.seo.authDescription },
    ],
  }),
  component: Auth,
});

function Auth() {
  const initial = Route.useSearch().tab as Tab;
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initial);
  const [forgotOpen, setForgotOpen] = useState(false);

  const authForms: Record<Tab, React.ReactNode> = {
    signup: <SignupForm onDone={() => navigate({ to: "/feed" })} />,
    login: (
      <LoginForm
        onDone={() => navigate({ to: "/feed" })}
        onForgot={() => setForgotOpen(true)}
      />
    ),
  };

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
            {texts.brand.prefix}
            <span className="gradient-text">{texts.brand.accent}</span>
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
              {texts.brand.prefix}
              <span className="gradient-text">{texts.brand.accent}</span>
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

          <div className="mt-8">{authForms[tab]}</div>

          <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {texts.auth.terms.prefix}{" "}
            <Link to="/termos" className="text-primary hover:underline">
              {texts.auth.terms.terms}
            </Link>{" "}
            {texts.auth.terms.conjunction}{" "}
            <Link to="/privacidade" className="text-primary hover:underline">
              {texts.auth.terms.privacy}
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
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

function SocialButtons() {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startOAuth = async (provider: OAuthProvider) => {
    setLoading(provider);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setError(texts.auth.social.unavailable(oauthProviders[provider].name));
    setLoading(null);
  };

  return (
    <div className="grid gap-2">
      {(Object.entries(oauthProviders) as [OAuthProvider, (typeof oauthProviders)[OAuthProvider]][]).map(
        ([provider, config]) => {
          const { Icon } = config;
          return (
            <button
              key={provider}
              type="button"
              onClick={() => startOAuth(provider)}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              {loading === provider ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon />
              )}
              {config.label}
            </button>
          );
        },
      )}
      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      {texts.auth.social.divider}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function SignupForm({ onDone }: { onDone: () => void }) {
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
          <Input
            name="name"
            placeholder={texts.auth.placeholders.name}
            autoComplete="name"
            required
            maxLength={80}
          />
        </Field>
        <Field label={texts.auth.fields.email} error={errors.email}>
          <Input
            name="email"
            type="email"
            placeholder={texts.auth.placeholders.email}
            autoComplete="email"
            required
            maxLength={255}
          />
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
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {texts.common.createAccount} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function LoginForm({ onDone, onForgot }: { onDone: () => void; onForgot: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (!parsed.success) {
      setErrors(mapValidationErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);
    clearSession();

    try {
      const result = await authApi.login(parsed.data);
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
      <h1 className="text-2xl font-semibold tracking-tight">{texts.auth.login.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{texts.auth.login.subtitle}</p>

      <div className="mt-6">
        <SocialButtons />
        <Divider />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={texts.auth.fields.email} error={errors.email}>
          <Input
            name="email"
            type="email"
            placeholder={texts.auth.placeholders.email}
            autoComplete="email"
            required
            maxLength={255}
          />
        </Field>
        <Field
          label={texts.auth.fields.password}
          error={errors.password}
          right={
            <button
              type="button"
              onClick={onForgot}
              className="text-xs font-medium text-primary hover:underline"
            >
              {texts.auth.password.forgot}
            </button>
          }
        >
          <div className="relative">
            <Input
              name="password"
              type={show ? "text" : "password"}
              placeholder={texts.auth.placeholders.password}
              autoComplete="current-password"
              required
              maxLength={128}
            />
            <PasswordVisibilityButton show={show} onToggle={() => setShow((value) => !value)} />
          </div>
        </Field>

        {formError && <ErrorBanner error={formError} />}
        <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {texts.common.enter} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function PasswordVisibilityButton({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  const Icon = show ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
      aria-label={show ? texts.auth.password.hide : texts.auth.password.show}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Field({
  label,
  error,
  right,
  children,
}: {
  label: string;
  error?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {right}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ForgotPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    if (!z.string().email().safeParse(email).success) {
      setErrors({ email: texts.auth.validation.invalidEmail });
      return;
    }

    setErrors({});
    setFormError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (error) {
      setFormError(error);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setSent(false);
    setErrors({});
    onOpenChange(false);
  };

  const content = sent ? (
    <div className="space-y-4 pb-2 pt-2">
      <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-4">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">{texts.auth.forgot.checkEmail}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {texts.auth.forgot.sentDescription}
          </p>
        </div>
      </div>
      <Button className="w-full rounded-full" onClick={close}>
        {texts.auth.forgot.understood}
      </Button>
    </div>
  ) : (
    <form onSubmit={submit} className="space-y-4 pb-2 pt-2" noValidate>
      <p className="text-sm text-muted-foreground">{texts.auth.forgot.description}</p>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{texts.auth.fields.email}</Label>
        <Input
          name="email"
          type="email"
          placeholder={texts.auth.placeholders.email}
          autoComplete="email"
          required
          maxLength={255}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      {formError && <ErrorBanner error={formError} />}
      <Button type="submit" className="w-full gap-2 rounded-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {texts.auth.forgot.sendLink} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(value) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold tracking-tight">{texts.auth.forgot.title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-foreground" aria-hidden>
      <path d="M16.4 12.7c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2.9-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3.1 2.4 1.3-.1 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.7-3.9zM14 5.4c.7-.8 1.2-1.9 1-3-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.4z" />
    </svg>
  );
}
