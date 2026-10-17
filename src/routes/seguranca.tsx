import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { AlertTriangle, CheckCircle2, Copy, Loader2, ShieldCheck } from "lucide-react";

import { ApiError, authApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AppContainer } from "@/components/app-container";
import { AppearanceDialog } from "@/components/appearance/appearance-dialog";
import { IdentitySection } from "@/components/security/identity-display-section";
import { IdentityVerificationSection } from "@/components/security/identity-verification-section";

export const Route = createFileRoute("/seguranca")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: buildPageShareTags({ title: texts.auth.twoFactor.pageTitle, path: "/seguranca" }),
  }),
  component: Seguranca,
});

/**
 * Segurança da conta: verificação de e-mail, segundo fator (app ou e-mail) e estado da credibilidade.
 *
 * A régua é a mesma do backend: conta verificada = e-mail confirmado OU segundo fator ativo, e é isso
 * que sustenta a reputação (sem nenhum dos dois ela é multiplicada por zero).
 */
function Seguranca() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["two-factor-status"],
    queryFn: () => authApi.twoFactorStatus(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });

  const handleError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.code === "INVALID_CREDENTIALS") {
      setError(texts.auth.twoFactor.wrongPassword);
      return;
    }
    if (err instanceof ApiError && err.code === "SECURITY_KEY_NOT_CONFIGURED") {
      setError(texts.auth.twoFactor.notConfigured);
      return;
    }
    setError(err instanceof ApiError ? err.message : fallback);
  };

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />

            <h1 className="text-2xl font-semibold tracking-tight">
              {texts.auth.twoFactor.pageHeading}
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {texts.auth.twoFactor.pageDescription}
          </p>
        </div>

        <IdentitySection />

        <section className="surface-card flex items-center justify-between gap-3 p-4">
          <div>
            <h2 className="text-base font-medium">{texts.appearance.title}</h2>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {texts.appearance.collectionsHint}
            </p>
          </div>

          <Button
            variant="outline"
            className="shrink-0 rounded-full"
            onClick={() => setAppearanceOpen(true)}
          >
            {texts.appearance.action}
          </Button>
        </section>

        {isLoading && (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {status && (
          <>
            <section
              className={`surface-card flex items-start gap-3 p-4 ${
                status.identityVerified ? "border-growth/40" : "border-destructive/40"
              }`}
            >
              {status.identityVerified ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-growth" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              )}

              <div>
                <p className="text-base font-medium">
                  {status.identityVerified
                    ? texts.auth.twoFactor.statusVerified
                    : texts.auth.twoFactor.statusPending}
                </p>

                {!status.identityVerified && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {texts.auth.twoFactor.reputationZero}
                  </p>
                )}

                {status.backupCodesLeft > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {texts.auth.twoFactor.backupLeft(status.backupCodesLeft)}
                  </p>
                )}
              </div>
            </section>

            {status.providerSecondFactor && (
              <section className="surface-card space-y-2 p-4">
                <h2 className="text-base font-medium">{texts.auth.twoFactor.providerSection}</h2>

                <p className="text-sm text-muted-foreground">
                  {texts.auth.twoFactor.providerActive}
                </p>
              </section>
            )}

            <EmailSection status={status} onError={handleError} onDone={refresh} />
            <TotpSection status={status} onError={handleError} onDone={refresh} />
            <EmailOtpSection status={status} onError={handleError} onDone={refresh} />
            <IdentityVerificationSection />

            <p className="text-center text-xs text-muted-foreground">
              <Link to="/bloqueados" className="text-primary hover:underline">
                {texts.account.menu.blockedUsers}
              </Link>
            </p>
          </>
        )}

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
    </AppContainer>
  );
}

type SectionProps = {
  status: import("@/types/application/auth/two-factor").TwoFactorStatus;
  onError: (err: unknown, fallback: string) => void;
  onDone: () => void;
};

function EmailSection({ status, onError }: SectionProps) {
  const [sent, setSent] = useState(false);

  const resend = useMutation({
    mutationFn: () => authApi.resendVerification(status.emailVerified ? "" : currentEmail()),
    onSuccess: () => setSent(true),
    onError: (err) => onError(err, texts.auth.twoFactor.error),
  });

  return (
    <section className="surface-card space-y-3 p-4">
      <h2 className="text-base font-medium">{texts.auth.twoFactor.emailSection}</h2>

      <p className="text-sm text-muted-foreground">
        {status.emailVerified
          ? texts.auth.twoFactor.emailConfirmed(currentEmail())
          : texts.auth.twoFactor.emailPending}
      </p>

      {!status.emailVerified && (
        <>
          {sent ? (
            <p className="rounded-xl bg-growth/10 px-4 py-2 text-sm text-growth">
              {texts.auth.twoFactor.emailResent}
            </p>
          ) : (
            <Button
              variant="outline"
              className="rounded-full"
              disabled={resend.isPending}
              onClick={() => resend.mutate()}
            >
              {texts.auth.twoFactor.emailResend}
            </Button>
          )}
        </>
      )}
    </section>
  );
}

function TotpSection({ status, onError, onDone }: SectionProps) {
  const [setup, setSetup] = useState<
    import("@/types/application/auth/two-factor").TotpSetup | null
  >(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");

  const start = useMutation({
    mutationFn: () => authApi.startTotpSetup(),
    onSuccess: (data) => setSetup(data),
    onError: (err) => onError(err, texts.auth.twoFactor.error),
  });

  const enable = useMutation({
    mutationFn: () => authApi.enableTotp(code.trim()),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setSetup(null);
      setCode("");
      onDone();
    },
    onError: (err) => onError(err, texts.auth.twoFactor.error),
  });

  const disable = useMutation({
    mutationFn: () => authApi.disableTotp(password),
    onSuccess: () => {
      setPassword("");
      onDone();
    },
    onError: (err) => onError(err, texts.auth.twoFactor.error),
  });

  const copySecret = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="surface-card space-y-3 p-4">
      <h2 className="text-base font-medium">{texts.auth.twoFactor.totpSection}</h2>

      <p className="text-sm text-muted-foreground">
        {status.totpEnabled ? texts.auth.twoFactor.totpActive : texts.auth.twoFactor.totpInactive}
      </p>

      {!status.totpAvailable && (
        <p className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
          {texts.auth.twoFactor.unavailable}
        </p>
      )}

      {backupCodes && (
        <div className="space-y-2 rounded-xl border border-growth/40 bg-growth/5 p-3">
          <p className="text-sm font-medium">{texts.auth.twoFactor.totpBackupTitle}</p>

          <p className="text-xs text-muted-foreground">
            {texts.auth.twoFactor.totpBackupDescription}
          </p>

          <ul className="grid grid-cols-2 gap-1 font-mono text-sm">
            {backupCodes.map((backup) => (
              <li key={backup}>{backup}</li>
            ))}
          </ul>

          <Button variant="outline" className="rounded-full" onClick={() => setBackupCodes(null)}>
            {texts.auth.twoFactor.totpDone}
          </Button>
        </div>
      )}

      {status.totpAvailable && !status.totpEnabled && !setup && !backupCodes && (
        <Button className="rounded-full" disabled={start.isPending} onClick={() => start.mutate()}>
          {texts.auth.twoFactor.totpStart}
        </Button>
      )}

      {setup && (
        <div className="space-y-3 rounded-xl border border-border-soft p-3">
          <div>
            <p className="text-sm font-medium">{texts.auth.twoFactor.totpSetupTitle}</p>

            <p className="mt-1 text-xs text-muted-foreground">
              {texts.auth.twoFactor.totpSetupDescription}
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {texts.auth.twoFactor.totpSecretLabel}
            </Label>

            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-muted px-3 py-2 text-sm">
                {setup.secret}
              </code>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full gap-1.5"
                onClick={copySecret}
              >
                <Copy className="h-3.5 w-3.5" />

                <>{copied ? texts.auth.twoFactor.totpSecretCopied : "Copiar"}</>
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {texts.auth.twoFactor.totpUriLabel}
            </Label>

            <code className="block break-all rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              {setup.otpauthUri}
            </code>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {texts.auth.twoFactor.totpCodeLabel}
            </Label>

            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
            />
          </div>

          <Button
            className="w-full rounded-full"
            disabled={code.trim().length !== 6 || enable.isPending}
            onClick={() => enable.mutate()}
          >
            {texts.auth.twoFactor.totpEnable}
          </Button>
        </div>
      )}

      {status.totpEnabled && (
        <div className="space-y-2 border-t border-border-soft pt-3">
          <Label className="text-xs text-muted-foreground">
            {texts.auth.twoFactor.passwordRequired}
          </Label>

          <div className="flex flex-wrap gap-2">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={texts.auth.twoFactor.passwordHelp}
              className="min-w-0 flex-1"
            />

            <Button
              variant="outline"
              className="shrink-0 rounded-full"
              disabled={!password || disable.isPending}
              onClick={() => disable.mutate()}
            >
              {texts.auth.twoFactor.totpDisable}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function EmailOtpSection({ status, onError, onDone }: SectionProps) {
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [password, setPassword] = useState("");

  const request = useMutation({
    mutationFn: () => authApi.requestEmailOtp(),
    onSuccess: () => setSent(true),
    onError: (err) => onError(err, texts.auth.twoFactor.error),
  });

  const confirm = useMutation({
    mutationFn: () => authApi.confirmEmailOtp(code.trim()),
    onSuccess: () => {
      setSent(false);
      setCode("");
      onDone();
    },
    onError: (err) => onError(err, texts.auth.twoFactor.error),
  });

  const disable = useMutation({
    mutationFn: () => authApi.disableEmailOtp(password),
    onSuccess: () => {
      setPassword("");
      onDone();
    },
    onError: (err) => onError(err, texts.auth.twoFactor.error),
  });

  return (
    <section className="surface-card space-y-3 p-4">
      <h2 className="text-base font-medium">{texts.auth.twoFactor.email2faSection}</h2>

      <p className="text-sm text-muted-foreground">
        {status.emailOtpEnabled
          ? texts.auth.twoFactor.email2faActive
          : texts.auth.twoFactor.email2faInactive}
      </p>

      {!status.emailVerified && !status.emailOtpEnabled && (
        <p className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
          {texts.auth.twoFactor.emailPending}
        </p>
      )}

      {status.emailVerified && !status.emailOtpEnabled && !sent && (
        <Button
          className="rounded-full"
          disabled={request.isPending}
          onClick={() => request.mutate()}
        >
          {texts.auth.twoFactor.email2faEnable}
        </Button>
      )}

      {sent && (
        <div className="space-y-2 rounded-xl border border-border-soft p-3">
          <p className="text-xs text-muted-foreground">
            {texts.auth.twoFactor.email2faConfirmHint}
          </p>

          <div className="flex flex-wrap gap-2">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="min-w-0 flex-1"
            />

            <Button
              className="shrink-0 rounded-full"
              disabled={code.trim().length !== 6 || confirm.isPending}
              onClick={() => confirm.mutate()}
            >
              {texts.auth.twoFactor.email2faConfirm}
            </Button>
          </div>
        </div>
      )}

      {status.emailOtpEnabled && (
        <div className="space-y-2 border-t border-border-soft pt-3">
          <Label className="text-xs text-muted-foreground">
            {texts.auth.twoFactor.passwordRequired}
          </Label>

          <div className="flex flex-wrap gap-2">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={texts.auth.twoFactor.passwordHelp}
              className="min-w-0 flex-1"
            />

            <Button
              variant="outline"
              className="shrink-0 rounded-full"
              disabled={!password || disable.isPending}
              onClick={() => disable.mutate()}
            >
              {texts.auth.twoFactor.email2faDisable}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/** E-mail da conta: vem do cache local do usuário autenticado. */
function currentEmail(): string {
  try {
    const raw = localStorage.getItem("current_user");
    return raw ? (JSON.parse(raw).email ?? "") : "";
  } catch {
    return "";
  }
}
