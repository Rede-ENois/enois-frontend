import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { sanctionsApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/penalidades")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: buildPageShareTags({ title: texts.sanctions.seoTitle, path: "/penalidades" }),
  }),
  component: Penalidades,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Penalidades() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-sanctions"],
    queryFn: () => sanctionsApi.mine(),
  });

  const appeal = useMutation({
    mutationFn: () => sanctionsApi.appeal(message),
    onSuccess: () => {
      setMessage("");
      toast(texts.sanctions.appealSent, "success");
      void queryClient.invalidateQueries({ queryKey: ["my-sanctions"] });
    },
    onError: () => toast(texts.sanctions.appealError, "error"),
  });

  const sanctions = data?.sanctions ?? [];
  const appeals = data?.appeals ?? [];
  const active = sanctions.find((s) => s.status === "ACTIVE" && s.type === "RESTRICTION");
  const banned = sanctions.find((s) => s.status === "ACTIVE" && s.type === "BAN");
  const pendingAppeal = appeals.find((a) => a.status === "PENDING");

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.sanctions.back}</>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{texts.sanctions.title}</h1>

          <p className="text-sm text-muted-foreground">{texts.sanctions.description}</p>
        </div>

        {banned && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {texts.sanctions.bannedNotice}
          </div>
        )}

        {active && !pendingAppeal && (
          <div className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {texts.sanctions.restrictedNotice}
            </p>

            <h2 className="text-sm font-semibold">{texts.sanctions.appealTitle}</h2>

            <p className="text-xs text-text-subtle">{texts.sanctions.appealDescription}</p>

            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={texts.sanctions.appealPlaceholder}
            />

            <Button
              className="rounded-full"
              disabled={appeal.isPending || message.trim().length < 10}
              onClick={() => appeal.mutate()}
            >
              {texts.sanctions.appealAction}
            </Button>
          </div>
        )}

        {active && pendingAppeal && (
          <div className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-amber-700 dark:text-amber-400">
            {texts.sanctions.appealPending}
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : sanctions.length === 0 ? (
          <div className="rounded-2xl border border-border-soft bg-surface-card">
            <EmptyState icon={ShieldAlert} title={texts.sanctions.empty} />
            <p className="pb-6 text-center text-sm text-text-subtle">{texts.sanctions.emptyHint}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
            {sanctions.map((sanction) => (
              <li key={sanction.id} className="space-y-1.5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                    {texts.sanctions.type[sanction.type] ?? sanction.type}
                  </span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      sanction.status === "ACTIVE"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "bg-muted text-text-subtle"
                    }`}
                  >
                    {texts.sanctions.statusLabel[sanction.status] ?? sanction.status}
                  </span>

                  <span className="ml-auto text-xs text-text-subtle">
                    {formatDate(sanction.createdAt)}
                  </span>
                </div>

                {sanction.reason && (
                  <p className="text-sm text-text-subtle">{sanction.reason}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {appeals.length > 0 && (
          <ul className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
            {appeals.map((item) => (
              <li key={item.id} className="space-y-1 p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      item.status === "APPROVED"
                        ? "bg-green-500/15 text-green-700 dark:text-green-400"
                        : item.status === "DENIED"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {texts.sanctions.appealStatus[item.status] ?? item.status}
                  </span>

                  <span className="ml-auto text-xs text-text-subtle">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-text-subtle">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppContainer>
  );
}
