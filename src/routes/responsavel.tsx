import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { SupervisedMinorView } from "@/types/application/age/supervised-minor-view";
import { Check, ShieldCheck, UserMinus, X } from "lucide-react";
import { z } from "zod";

import { parentalApi } from "@/lib/api";
import { hasSession } from "@/lib/require-auth";
import { ogMetas } from "@/lib/seo";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";

const TOKEN_KEY = "enois:guardian-token";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/responsavel")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Supervisão parental · Énóis" },
      {
        name: "description",
        content:
          "Autorize ou revogue o uso do Énóis por um adolescente sob sua responsabilidade legal.",
      },
      ...ogMetas(
        "Supervisão parental · Énóis",
        "Autorize ou revogue o uso do Énóis por um adolescente sob sua responsabilidade legal.",
      ),
    ],
  }),
  component: Responsavel,
});

function Responsavel() {
  const { token } = Route.useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const authenticated = hydrated && hasSession();

  // O link do e-mail pode passar pelo login: guarda o token para retomar depois.
  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      setPendingToken(token);
      return;
    }
    setPendingToken(sessionStorage.getItem(TOKEN_KEY));
  }, [hydrated, token]);

  const supervised = useQuery({
    queryKey: ["age", "supervised-minors"],
    queryFn: () => parentalApi.mine(),
    enabled: authenticated,
    retry: false,
  });

  const accept = useMutation({
    mutationFn: () => parentalApi.accept(pendingToken ?? ""),
    onSuccess: () => {
      sessionStorage.removeItem(TOKEN_KEY);
      setPendingToken(null);
      setDecision("accepted");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["age", "supervised-minors"] });
      void queryClient.invalidateQueries({ queryKey: ["profile", "age-state"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : texts.guardian.error),
  });

  const reject = useMutation({
    mutationFn: () => parentalApi.reject(pendingToken ?? ""),
    onSuccess: () => {
      sessionStorage.removeItem(TOKEN_KEY);
      setPendingToken(null);
      setDecision("rejected");
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : texts.guardian.error),
  });

  const revoke = useMutation({
    mutationFn: (minorUserId: string) => parentalApi.revoke(minorUserId),
    onSuccess: () => {
      toast(texts.guardian.revoked, "success");
      void queryClient.invalidateQueries({ queryKey: ["age", "supervised-minors"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : texts.guardian.error, "error"),
  });

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-4 py-6">
        <header className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-text-strong">
              {texts.guardian.title}
            </h1>

            <p className="text-sm text-text-subtle">{texts.guardian.subtitle}</p>
          </div>
        </header>

        {!authenticated && (
          <section className="surface-card space-y-3 p-5">
            <p className="text-sm text-text-subtle">{texts.guardian.loginRequired}</p>

            <Button asChild className="rounded-full">
              <Link to="/entrar" search={{ tab: "login" }}>
                {texts.common.enter}
              </Link>
            </Button>
          </section>
        )}

        {authenticated && decision && (
          <section className="surface-card p-5">
            <p className="text-sm font-medium text-text-strong">
              {decision === "accepted" ? texts.guardian.accepted : texts.guardian.rejected}
            </p>
          </section>
        )}

        {authenticated && pendingToken && !decision && (
          <section className="surface-card space-y-4 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

              <div className="space-y-1">
                <h2 className="text-base font-medium text-text-strong">
                  {texts.guardian.inviteTitle}
                </h2>

                <p className="text-sm leading-relaxed text-text-subtle">
                  {texts.guardian.inviteBody}
                </p>
              </div>
            </div>

            <ul className="space-y-1 text-sm text-text-subtle">
              <li>· {texts.guardian.bullet1}</li>

              <li>· {texts.guardian.bullet2}</li>

              <li>· {texts.guardian.bullet3}</li>
            </ul>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <Button
                className="gap-2 rounded-full"
                disabled={accept.isPending || reject.isPending}
                onClick={() => {
                  setError(null);
                  accept.mutate();
                }}
              >
                <Check className="h-4 w-4" />

                <>{texts.guardian.accept}</>
              </Button>

              <Button
                variant="outline"
                className="gap-2 rounded-full"
                disabled={accept.isPending || reject.isPending}
                onClick={() => {
                  setError(null);
                  reject.mutate();
                }}
              >
                <X className="h-4 w-4" />

                <>{texts.guardian.reject}</>
              </Button>
            </div>
          </section>
        )}

        {authenticated && (
          <section className="surface-card space-y-3 p-5">
            <h2 className="text-base font-medium text-text-strong">{texts.guardian.mineTitle}</h2>

            {supervised.isLoading && (
              <p className="text-sm text-text-subtle">{texts.guardian.loading}</p>
            )}

            {!supervised.isLoading && (supervised.data?.length ?? 0) === 0 && (
              <p className="text-sm text-text-subtle">{texts.guardian.none}</p>
            )}

            <ul className="space-y-2">
              {(supervised.data ?? []).map((minor) => (
                <MinorRow
                  key={minor.minorUserId}
                  minor={minor}
                  onRevoke={() => revoke.mutate(minor.minorUserId)}
                  revoking={revoke.isPending}
                />
              ))}
            </ul>
          </section>
        )}

        <p className="pb-2 text-center text-xs text-text-subtle">{texts.guardian.footer}</p>
      </div>
    </AppContainer>
  );
}

function MinorRow({
  minor,
  onRevoke,
  revoking,
}: {
  minor: SupervisedMinorView;
  onRevoke: () => void;
  revoking: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-soft px-3 py-2">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-text-strong">{minor.name}</span>

        <span className="block text-xs text-text-subtle">
          @{minor.username} ·{" "}
          {texts.guardian.since(new Date(minor.since).toLocaleDateString("pt-BR"))}
        </span>
      </span>

      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-full"
        disabled={revoking}
        onClick={onRevoke}
      >
        <UserMinus className="h-4 w-4" />

        <>{texts.guardian.revoke}</>
      </Button>
    </li>
  );
}
