import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CalendarScope } from "@/types/application/calendar/calendar-scope";
import type { CalendarSubscriptionView } from "@/types/application/calendar/calendar-subscription-view";
import { CalendarSubscriptionCard } from "@rede-enois/design-system/domain";
import { LoadingState, PageHeader, useToast } from "@rede-enois/design-system/ui";
import { Rss } from "lucide-react";

import { calendarApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

const SUBSCRIPTION_KEY = ["agenda", "assinatura"] as const;

/**
 * A assinatura privada `.ics` (fase 9): o endereço que um calendário externo lê sozinho. O token
 * em claro só existe na resposta que cria ou regenera o link — depois disso o servidor guarda só o
 * hash —, então o endereço recém-gerado vive no estado desta tela e some ao recarregar.
 *
 * O desenho é do Design System (`CalendarSubscriptionCard`); aqui ficam a consulta, as mutações, a
 * área de transferência e as frases do app.
 */
export const Route = createFileRoute("/agenda_/assinatura")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.agenda.subscription.seoTitle }] }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [scope, setScope] = useState<CalendarScope | null>(null);
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscription = useQuery({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: () => calendarApi.subscription(),
  });

  const remember = (view: CalendarSubscriptionView) => {
    queryClient.setQueryData(SUBSCRIPTION_KEY, view);
    setScope(view.scope);
    setCopied(false);
    // Só a criação e a regeneração trazem o token; sem ele não há endereço novo para mostrar.
    setFreshUrl(view.token ? calendarApi.subscriptionUrl(view.token) : null);
  };

  const create = useMutation({
    mutationFn: () => calendarApi.createSubscription(scope),
    onSuccess: (view) => {
      setError(null);
      remember(view);
    },
    onError: () => setError(texts.agenda.subscription.errorCreate),
  });

  const regenerate = useMutation({
    mutationFn: () => calendarApi.regenerateSubscription(),
    onSuccess: (view) => {
      setError(null);
      remember(view);
    },
    onError: () => setError(texts.agenda.subscription.errorRegenerate),
  });

  const revoke = useMutation({
    mutationFn: () => calendarApi.revokeSubscription(),
    onSuccess: () => {
      setError(null);
      setFreshUrl(null);
      setCopied(false);
      queryClient.setQueryData(SUBSCRIPTION_KEY, null);
    },
    onError: () => setError(texts.agenda.subscription.errorRevoke),
  });

  const copy = async () => {
    if (!freshUrl) return;
    try {
      await navigator.clipboard.writeText(freshUrl);
      setCopied(true);
      toast(texts.agenda.subscription.copied, "success");
    } catch {
      toast(texts.agenda.subscription.copyError, "error");
    }
  };

  const pending = create.isPending || regenerate.isPending || revoke.isPending;

  return (
    <AppContainer>
      <PageHeader
        title={texts.agenda.subscription.title}
        description={texts.agenda.subscription.subtitle}
        icon={Rss}
      />

      {subscription.isPending ? (
        <LoadingState />
      ) : (
        <CalendarSubscriptionCard
          subscription={subscription.data ?? null}
          freshUrl={freshUrl}
          scope={scope}
          onScopeChange={setScope}
          onCreate={() => create.mutate()}
          onRegenerate={() => regenerate.mutate()}
          onRevoke={() => revoke.mutate()}
          onCopy={() => void copy()}
          error={error ?? (subscription.isError ? texts.agenda.subscription.errorLoad : null)}
          pending={pending}
          copied={copied}
        />
      )}
    </AppContainer>
  );
}
