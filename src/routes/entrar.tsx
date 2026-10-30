import { type FormEvent, type ReactNode, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { SIGNUP_OPEN } from "@/constants/account";
import { OAUTH_PROVIDER_LABELS, availableSocialProviders } from "@/constants/auth-providers";
import { texts } from "@/texts";
import type { OAuthProvider } from "@/types/application/auth/oauth-provider";
import type { TwoFactorChallenge } from "@/types/application/auth/two-factor-challenge";
import type { AuthFormProps } from "@/types/routes/auth/auth-form-props";
import type { FieldProps } from "@/types/routes/auth/field-props";
import type { ForgotPasswordDialogProps } from "@/types/routes/auth/forgot-password-dialog-props";
import type { LoginFormProps } from "@/types/routes/auth/login-form-props";
import type { SocialButtonsProps } from "@/types/routes/auth/social-buttons-props";
import type { TabBtnProps } from "@/types/routes/auth/tab-btn-props";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import {
  Button,
  DateTextInput,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PasswordInput,
} from "@rede-enois/design-system/ui";
import { ArrowRight, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { z } from "zod";

import { ApiError, authApi, clearSession } from "@/lib/api";
import { anoAtual } from "@/lib/date/format";
import { ogMetas } from "@/lib/seo";
import { storeSession } from "@/lib/session";
import { twoFactorLockedMessage } from "@/lib/two-factor-locked";
import { useAuthConfig } from "@/lib/use-auth-config";

import { AuthHero } from "@/components/auth-hero";
import { ErrorBanner } from "@/components/error-banner";
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
      ...ogMetas(texts.auth.seo.authTitle, texts.auth.seo.authDescription),
    ],
  }),
  component: Auth,
});

const loginSchema = z.object({
  email: z.string().trim().email(texts.auth.validation.invalidEmail).max(255),
  password: z.string().min(6, texts.auth.validation.loginPasswordMin).max(128),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, texts.auth.validation.signupNameMin).max(80),
  email: z.string().trim().email(texts.auth.validation.invalidEmail).max(255),
  password: z.string().min(8, texts.auth.validation.passwordMin).max(128),
  // ECA Digital: a data de nascimento e obrigatoria no cadastro (o backend recalcula a idade).
  birthDate: z
    .string()
    .min(1, texts.auth.validation.birthDateRequired)
    .refine((value) => value <= new Date().toISOString().slice(0, 10), {
      message: texts.auth.validation.birthDateFuture,
    }),
  // Checkbox marcado chega como "on"; ausente significa nao aceito.
  acceptedTerms: z
    .string()
    .optional()
    .refine((value) => value === "on", { message: texts.auth.validation.termsRequired }),
});

function Auth() {
  const initial = Route.useSearch().tab;
  const navigate = useNavigate();
  const [tab, setTab] = useState(initial);
  const [forgotOpen, setForgotOpen] = useState(false);
  // Cadastros fechados: `/entrar?tab=signup` cai no login e o aviso explica o motivo.
  const activeTab = SIGNUP_OPEN ? tab : "login";

  return (
    <div className="grid grid-cols-1 min-h-screen lg:grid-cols-2">
      {/* Brand side */}
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
          <img src="/brand/mark-primary.svg" alt="" className="h-9 w-9 shrink-0" />

          <span className="text-lg font-semibold tracking-tight">
            <>{texts.brand.prefix}</>

            <span className="gradient-text">{texts.brand.accent}</span>
          </span>
        </Link>

        <AuthHero />
      </aside>

      {/* Form side */}
      <section className="flex flex-col px-6 py-10 sm:px-12">
        <div className="flex items-center justify-between lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <img src="/brand/mark-primary.svg" alt="" className="h-9 w-9 shrink-0" />

            <span className="font-semibold tracking-tight">
              <>{texts.brand.prefix}</>

              <span className="gradient-text">{texts.brand.accent}</span>
            </span>
          </Link>

          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {SIGNUP_OPEN ? (
            <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
              <TabBtn active={tab === "signup"} onClick={() => setTab("signup")}>
                {texts.common.createAccount}
              </TabBtn>

              <TabBtn active={tab === "login"} onClick={() => setTab("login")}>
                {texts.common.enter}
              </TabBtn>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-sm font-medium text-foreground">{texts.auth.signupClosed.title}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {texts.auth.signupClosed.description}
              </p>
            </div>
          )}

          <div className="mt-8">
            {activeTab === "signup" ? (
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
            <>{texts.auth.terms.prefix}</>

            <Link to="/termos" className="text-primary hover:underline">
              {texts.auth.terms.terms}
            </Link>

            <>{texts.auth.terms.conjunction}</>

            <Link to="/privacidade" className="text-primary hover:underline">
              {texts.auth.terms.privacy}
            </Link>

            <>{texts.auth.terms.end}</>
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

/**
 * Entrada social: os provedores habilitados em ENABLED_OAUTH_PROVIDERS menos os que o ambiente
 * desligou (o Google pode estar desligado — a API avisa em `/auth/config` e recusa o start).
 */
function SocialButtons({ mode }: SocialButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const config = useAuthConfig();
  const providers = availableSocialProviders(config.data?.googleLoginEnabled);

  const start = async (provider: OAuthProvider) => {
    setLoading(provider);
    setError(null);
    try {
      // O backend registra state + nonce no servidor e devolve a URL de autorização.
      // `mode` faz o backend recusar cadastro com e-mail que já existe, em vez de entrar na conta.
      const start = await authApi.oauthStart(provider, mode);
      window.location.href = start.authorizationUrl;
    } catch (err) {
      setError(mensagemDeFalhaSocial(err, provider));
      setLoading(null);
    }
  };

  const providerButton = (provider: OAuthProvider, icon: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => start(provider)}
      disabled={loading !== null}
      className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
    >
      {loading === provider ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <>{label}</>
    </button>
  );

  /** Ícone e rótulo de cada provedor conhecido. Provedor sem par visual não vira botão. */
  const visualDoProvedor = (provider: OAuthProvider): { icon: ReactNode; label: string } | null => {
    if (provider === "GOOGLE") {
      return {
        icon: <GoogleIcon />,
        label: mode === "signup" ? texts.auth.social.googleSignup : texts.auth.social.google,
      };
    }
    if (provider === "LINKEDIN") {
      return {
        icon: <LinkedinIcon />,
        label: mode === "signup" ? texts.auth.social.linkedinSignup : texts.auth.social.linkedin,
      };
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {providers.map((provider) => {
        const visual = visualDoProvedor(provider);
        if (!visual) return null;
        return providerButton(provider, visual.icon, visual.label);
      })}
      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

/**
 * Mensagem de falha da entrada social.
 *
 * A API sabe por que recusou: `OAUTH_PROVIDER_DISABLED` quer dizer que o provedor está desligado
 * neste ambiente, e a mensagem dela diz melhor que qualquer texto genérico. O resto (aplicativo do
 * OAuth ainda em aprovação) mantém o texto de sempre — mas citando o provedor certo: antes ele
 * dizia "Google" mesmo quando a falha era do LinkedIn.
 */
function mensagemDeFalhaSocial(err: unknown, provider: OAuthProvider): string {
  const nome = OAUTH_PROVIDER_LABELS[provider];
  if (err instanceof ApiError && err.code === "OAUTH_PROVIDER_DISABLED") {
    return texts.auth.social.providerDisabled(nome);
  }
  // Sem o aplicativo aprovado no provedor o start falha: explicamos em vez de vazar o erro cru.
  const detail = err instanceof ApiError && import.meta.env.DEV ? ` (${err.message})` : "";
  return `${texts.auth.social.pendingApproval(nome)}${detail}`;
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#0A66C2" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />

      <>{texts.auth.social.divider}</>

      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

function SignupForm(_props: AuthFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  /** Conta criada e pendente de confirmação: o formulário dá lugar à tela "confirme seu e-mail". */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const config = useAuthConfig();
  const captchaMode = config.data?.captchaMode;
  const turnstileSiteKey = config.data?.turnstileSiteKey ?? TURNSTILE_SITE_KEY;
  const challenge = useQuery({
    queryKey: ["auth", "signup-challenge"],
    queryFn: () => authApi.signupChallenge(),
    enabled: captchaMode === "CHALLENGE",
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const [challengeAnswer, setChallengeAnswer] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as string] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setFormError(null);
    if (captchaMode === "CHALLENGE" && (!challenge.data || !challengeAnswer.trim())) {
      setFormError(new Error(texts.auth.captcha.required));
      return;
    }
    setLoading(true);
    clearSession();
    try {
      // O cadastro não abre sessão: a conta nasce pendente até confirmar o e-mail.
      const result = await authApi.signup({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        birthDate: parsed.data.birthDate,
        acceptedTerms: parsed.data.acceptedTerms === "on",
        website: fd.get("website") as string | undefined,
        turnstileToken:
          captchaMode === "TURNSTILE"
            ? (turnstileRef.current?.getResponse() ?? undefined)
            : undefined,
        challengeId: captchaMode === "CHALLENGE" ? challenge.data?.challengeId : undefined,
        challengeAnswer: captchaMode === "CHALLENGE" ? Number(challengeAnswer.trim()) : undefined,
      });
      setPendingEmail(result.email);
    } catch (err) {
      setFormError(err);
      // O captcha é de uso único: depois de uma falha, pede um novo (e limpa a resposta).
      turnstileRef.current?.reset();
      if (captchaMode === "CHALLENGE") {
        setChallengeAnswer("");
        void challenge.refetch();
      }
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return <EmailPendingScreen email={pendingEmail} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{texts.auth.signup.title}</h1>

      <p className="mt-1 text-sm text-muted-foreground">{texts.auth.signup.subtitle}</p>

      <div className="mt-6">
        <SocialButtons mode="signup" />
        <Divider />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {/* Honeypot: campo invisível que bots preenchem e humanos não veem */}
        <input
          name="website"
          type="text"
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
        />

        <Field label={texts.auth.fields.fullName} error={errors.name}>
          <Input
            name="name"
            placeholder={texts.auth.placeholders.name}
            autoComplete="name"
            required
            maxLength={80}
          />
        </Field>

        <Field label={texts.auth.fields.birthDate} error={errors.birthDate}>
          <DateTextInput
            name="birthDate"
            required
            autoComplete="bday"
            min={`${anoAtual() - 120}-01-01`}
            max={new Date().toISOString().slice(0, 10)}
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
          <PasswordInput
            name="password"
            revealed={show}
            onToggle={() => setShow((value) => !value)}
            placeholder={texts.auth.placeholders.newPassword}
            autoComplete="new-password"
            required
            maxLength={128}
          />
        </Field>

        <div className="space-y-1.5">
          <label className="flex items-start gap-2 text-xs font-normal text-text-subtle">
            <input type="checkbox" name="acceptedTerms" className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              <>{texts.auth.signup.termsPrefix}</>

              <Link
                to="/termos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                <>{texts.auth.signup.termsLink}</>
              </Link>

              <>{texts.auth.signup.termsAnd}</>

              <Link
                to="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                <>{texts.auth.signup.privacyLink}</>
              </Link>

              <>{texts.auth.signup.termsSuffix}</>
            </span>
          </label>
          {errors.acceptedTerms && (
            <p className="text-xs text-destructive">{errors.acceptedTerms}</p>
          )}
        </div>

        {!!formError && <ErrorBanner error={formError} showDetails={false} />}
        {captchaMode === "TURNSTILE" && turnstileSiteKey && (
          <Turnstile
            ref={turnstileRef}
            siteKey={turnstileSiteKey}
            options={{
              // Invisible na maior parte do tempo: o widget so aparece se o Cloudflare
              // pedir interacao. Protecao continua, caixa na tela nao.
              size: "flexible",
              theme: "dark",
              appearance: "interaction-only",
            }}
          />
        )}
        {captchaMode === "CHALLENGE" && (
          <div className="space-y-1.5 rounded-xl border border-border-soft bg-surface-1 p-3">
            <Label htmlFor="challengeAnswer">{texts.auth.captcha.label}</Label>

            <p className="text-sm font-medium text-text-strong">
              {challenge.isLoading ? texts.auth.captcha.loading : challenge.data?.question}
            </p>

            <div className="flex items-center gap-2">
              <Input
                id="challengeAnswer"
                inputMode="numeric"
                autoComplete="off"
                maxLength={3}
                value={challengeAnswer}
                onChange={(event) => setChallengeAnswer(event.target.value.replace(/\D/g, ""))}
                placeholder={texts.auth.captcha.placeholder}
                className="w-24"
              />

              <Button
                type="button"
                variant="ghost"
                className="w-auto rounded-full text-xs"
                onClick={() => {
                  setChallengeAnswer("");
                  void challenge.refetch();
                }}
              >
                {texts.auth.captcha.refresh}
              </Button>
            </div>
          </div>
        )}
        <Button
          type="submit"
          className="w-full rounded-full gap-2"
          disabled={loading || (captchaMode === "CHALLENGE" && !challenge.data)}
        >
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

/**
 * Estado "aguardando confirmação": mostrado logo após o cadastro e também quando o login encontra
 * uma conta pendente. Aqui fica claro o que fazer e há reenvio, com o resultado de cada tentativa.
 */
function EmailPendingScreen({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed" | "limited">("idle");

  const resend = async () => {
    setState("sending");
    try {
      await authApi.resendVerification(email);
      setState("sent");
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setState("limited");
        return;
      }
      setState("failed");
    }
  };

  return (
    <div>
      <MailCheck className="h-7 w-7 text-primary" />

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{texts.auth.pending.title}</h1>

      <p className="mt-2 text-sm text-muted-foreground">{texts.auth.pending.description(email)}</p>

      <ul className="mt-4 space-y-1.5 text-sm font-normal text-muted-foreground">
        <li>· {texts.auth.pending.step1}</li>

        <li>· {texts.auth.pending.step2}</li>

        <li>· {texts.auth.pending.step3}</li>
      </ul>

      {state === "sent" && (
        <p className="mt-4 rounded-xl bg-growth/10 px-4 py-2 text-sm text-growth">
          {texts.auth.pending.sent}
        </p>
      )}

      {state === "failed" && (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {texts.auth.pending.failed}
        </p>
      )}

      {state === "limited" && (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {texts.auth.pending.limited}
        </p>
      )}

      <Button
        className="mt-6 w-full rounded-full gap-2"
        onClick={resend}
        disabled={state === "sending"}
      >
        {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}

        <>{state === "sending" ? texts.auth.pending.sending : texts.auth.pending.resend}</>
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <>{texts.auth.pending.wrongEmail}</>
      </p>
    </div>
  );
}

function LoginForm({ onDone, onForgot }: LoginFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const loginTurnstileRef = useRef<TurnstileInstance>(null);
  const config = useAuthConfig();
  const turnstileSiteKey = config.data?.turnstileSiteKey ?? TURNSTILE_SITE_KEY;
  /** Conta pendente de confirmação: em vez de "erro", a tela explica e oferece reenviar. */
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  /** Segundo fator pedido pelo backend depois da senha correta. */
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  /** Senha expirada: backend retornou token de reset. */
  const [expiredResetToken, setExpiredResetToken] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as string] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setFormError(null);
    setLoading(true);
    clearSession();
    try {
      const result = await authApi.login({
        email: parsed.data.email,
        password: parsed.data.password,
        turnstileToken: loginTurnstileRef.current?.getResponse() ?? undefined,
      });

      // Senha expirada: backend retorna token de reset pra trocar direto.
      if ("passwordExpired" in result && result.passwordExpired) {
        setExpiredResetToken((result as unknown as { resetToken: string }).resetToken);
        return;
      }

      // Conta com segundo fator: a senha levou ao desafio, não à sessão.
      if ("twoFactorRequired" in result) {
        setChallenge(result);
        return;
      }

      storeSession(result);
      // E2E: sincroniza as chaves locais com o servidor (fire-and-forget).
      // Compara a chave publica local com a do servidor: se diferem, restaura do backup.
      // Garante que todos os devices usem o mesmo keypair sem re-configurar.
      import("@/lib/e2e/key-manager").then(({ syncKeysOnLogin }) =>
        syncKeysOnLogin(parsed.data.password).catch(() => {}),
      );
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(parsed.data.email);
        return;
      }
      setFormError(err);
    } finally {
      setLoading(false);
    }
  };

  if (unverifiedEmail) {
    return <EmailPendingScreen email={unverifiedEmail} />;
  }

  if (challenge) {
    return <TwoFactorForm challenge={challenge} onDone={onDone} />;
  }

  if (expiredResetToken) {
    return (
      <PasswordExpiredForm
        resetToken={expiredResetToken}
        onDone={() => {
          setExpiredResetToken(null);
        }}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{texts.auth.login.title}</h1>

      <p className="mt-1 text-sm text-muted-foreground">{texts.auth.login.subtitle}</p>

      <div className="mt-6">
        <SocialButtons mode="login" />
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
          <PasswordInput
            name="password"
            revealed={show}
            onToggle={() => setShow((value) => !value)}
            placeholder={texts.auth.placeholders.password}
            autoComplete="current-password"
            required
            maxLength={128}
          />
        </Field>

        {!!formError && <ErrorBanner error={formError} showDetails={false} />}
        {config.data?.captchaMode === "TURNSTILE" && turnstileSiteKey && (
          <Turnstile
            ref={loginTurnstileRef}
            siteKey={turnstileSiteKey}
            options={{
              // Invisible na maior parte do tempo: o widget so aparece se o Cloudflare
              // pedir interacao. Protecao continua, caixa na tela nao.
              size: "flexible",
              theme: "dark",
              appearance: "interaction-only",
            }}
          />
        )}
        <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <>{texts.common.enter} </>

              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

/**
 * Segundo passo do login: código do aplicativo authenticator ou o código enviado por e-mail.
 * O backend devolve `method`, então a tela já sabe o que pedir (e oferece reenviar só no caso do e-mail).
 */
function TwoFactorForm({
  challenge,
  onDone,
}: {
  challenge: TwoFactorChallenge;
  onDone: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [resent, setResent] = useState(false);

  const byEmail = challenge.method === "EMAIL";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.verifyTwoFactor(challenge.challengeId, code.trim());
      storeSession(result);
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.code === "TOO_MANY_ATTEMPTS") {
        setError(new Error(twoFactorLockedMessage(challenge.method)));
        return;
      }
      setError(err instanceof Error ? err : new Error(texts.auth.twoFactor.error));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await authApi.resendTwoFactor(challenge.challengeId);
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(texts.auth.twoFactor.error));
    }
  };

  return (
    <div>
      <ShieldCheck className="h-7 w-7 text-primary" />

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{texts.auth.twoFactor.title}</h1>

      <p className="mt-1 text-sm text-muted-foreground">
        {byEmail ? texts.auth.twoFactor.emailHint : texts.auth.twoFactor.totpHint}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label={texts.auth.twoFactor.code}>
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={byEmail ? 6 : 12}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={byEmail ? "000000" : texts.auth.twoFactor.codePlaceholder}
          />
        </Field>

        {resent && (
          <p className="rounded-xl bg-growth/10 px-4 py-2 text-sm text-growth">
            {texts.auth.twoFactor.resent}
          </p>
        )}

        {error ? <ErrorBanner error={error} /> : null}

        <Button
          type="submit"
          className="w-full rounded-full gap-2"
          disabled={loading || !code.trim()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}

          <>{texts.auth.twoFactor.confirm}</>
        </Button>

        {byEmail && (
          <Button type="button" variant="ghost" className="w-full rounded-full" onClick={resend}>
            {texts.auth.twoFactor.resend}
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {texts.auth.twoFactor.recoveryHint}
        </p>
      </form>
    </div>
  );
}

function PasswordExpiredForm({ resetToken, onDone }: { resetToken: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const t = {
    title: "Atualize sua senha",
    description:
      "De acordo com a nossa nova política de segurança, selecione uma nova senha para continuar.",
    newPassword: "Nova senha",
    confirm: "Confirmar nova senha",
    action: "Salvar nova senha",
    mismatch: "As senhas não coincidem.",
    success: "Senha atualizada. Faça login com a nova senha.",
    error: "Não foi possível atualizar a senha. Tente novamente.",
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = (fd.get("password") as string)?.trim();
    const confirm = (fd.get("confirm") as string)?.trim();
    if (!password || password.length < 8) {
      setError("Mínimo de 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError(t.mismatch);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.resetPassword(resetToken, password);
      // Backend retorna sessao quando o reset veio de senha expirada (auto-login).
      if ("user" in result) {
        storeSession(result as never);
        window.location.href = "/feed";
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <ShieldCheck className="h-7 w-7 text-primary" />

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t.title}</h1>

        <p className="mt-2 text-sm text-muted-foreground">{t.success}</p>

        <Button className="mt-6 w-full" onClick={onDone}>
          Entrar
        </Button>
      </div>
    );
  }

  return (
    <div>
      <ShieldCheck className="h-7 w-7 text-primary" />

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t.title}</h1>

      <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label={t.newPassword}>
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            minLength={8}
            required
          />
        </Field>

        <Field label={t.confirm}>
          <Input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.action}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, error, right, children }: FieldProps) {
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

function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
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
    } catch (err) {
      setFormError(err);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setSent(false);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold tracking-tight">
            {texts.auth.forgot.title}
          </DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="space-y-4 pb-2 pt-2">
            <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-4">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

              <div>
                <p className="text-sm font-medium">{texts.auth.forgot.checkEmail}</p>

                <p className="mt-1 text-sm text-muted-foreground">
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
            {!!formError && <ErrorBanner error={formError} />}
            <Button type="submit" className="w-full gap-2 rounded-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <>{texts.auth.forgot.sendLink} </>

                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}
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
