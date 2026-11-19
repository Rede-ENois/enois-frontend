import { useCallback, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getSanctionSessionGeneration,
  useSanctionSessionGeneration,
} from "@/stores/sanction-access.store";
import type { SanctionsSnapshot } from "@/types/application/moderation/sanctions-snapshot";
import { SanctionsView } from "@rede-enois/design-system/domain";

import { sanctionsApi } from "@/lib/api";
import { ApiError, clearSession } from "@/lib/api-client";
import { useSanctionClock } from "@/lib/moderation/use-sanction-clock";

export function SanctionsContainer({ mode }: { mode: "history" | "suspended" }) {
  const generation = useSanctionSessionGeneration();
  return <SanctionsSession key={generation} mode={mode} generation={generation} />;
}

function SanctionsSession({
  mode,
  generation,
}: {
  mode: "history" | "suspended";
  generation: number;
}) {
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const query = useQuery({
    queryKey: ["my-sanctions"],
    queryFn: async (): Promise<SanctionsSnapshot> => {
      const response = await sanctionsApi.mine();
      return { response, observedAt: performance.now() };
    },
    enabled: typeof window !== "undefined",
    refetchOnMount: "always",
  });
  const { refetch } = query;
  const refresh = useCallback(() => {
    void refetch({ cancelRefetch: false });
  }, [refetch]);
  const decision = query.data?.response;
  const sanctions = decision?.sanctions ?? [];
  const deadlines = sanctions
    .filter((s) => s.status === "ACTIVE" && s.deadline.at !== null)
    .map((s) => s.deadline.at ?? "");
  const now = useSanctionClock(decision?.serverNow, deadlines, refresh, query.data?.observedAt);
  const eligible = sanctions.find((s) => s.canAppeal);
  const pending = decision?.appeals.some((a) => a.status === "PENDING");
  const appeal = useMutation({
    mutationFn: () => {
      if (getSanctionSessionGeneration() !== generation) {
        throw new DOMException("Sessão de apresentação substituída", "AbortError");
      }
      return sanctionsApi.appeal(message.trim());
    },
    onSuccess: async () => {
      if (getSanctionSessionGeneration() !== generation) return;
      setMessage("");
      await client.invalidateQueries({ queryKey: ["my-sanctions"] });
    },
    onSettled: () => {
      submitting.current = false;
    },
  });
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) clearSession();
  }, [query.error]);
  const submit = () => {
    if (submitting.current || appeal.isPending || !eligible || pending || query.isError) return;
    const length = message.trim().length;
    if (length < 10 || length > 1000) return;
    submitting.current = true;
    appeal.mutate();
  };
  const suspended = sanctions.some((s) => s.type === "SUSPENDED" && s.status === "ACTIVE");
  return (
    <SanctionsView
      mode={mode === "suspended" && decision && !suspended ? "history" : mode}
      sanctions={sanctions}
      appeals={decision?.appeals ?? []}
      now={now ?? 0}
      loading={query.isPending}
      error={query.isError}
      refreshing={query.isFetching}
      appealMessage={message}
      onAppealMessageChange={(value) => {
        setMessage(value);
        appeal.reset();
      }}
      onAppeal={submit}
      appealSubmitting={appeal.isPending || submitting.current}
      appealError={appeal.isError}
      onRetry={refresh}
      appealSanctionId={eligible?.id}
      backHref={mode === "history" ? "/feed" : undefined}
      loginHref={mode === "suspended" ? "/entrar?tab=login" : undefined}
    />
  );
}
