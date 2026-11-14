import { useCallback, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SanctionsView } from "@rede-enois/design-system/domain";

import { sanctionsApi } from "@/lib/api";
import { ApiError, clearSession } from "@/lib/api-client";
import { useSanctionClock } from "@/lib/moderation/use-sanction-clock";

export function SanctionsContainer({ mode }: { mode: "history" | "suspended" }) {
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const query = useQuery({
    queryKey: ["my-sanctions"],
    queryFn: () => sanctionsApi.mine(),
    enabled: typeof window !== "undefined",
  });
  const { refetch } = query;
  const refresh = useCallback(() => {
    void refetch({ cancelRefetch: false });
  }, [refetch]);
  const sanctions = query.data?.sanctions ?? [];
  const deadlines = sanctions
    .filter((s) => s.status === "ACTIVE" && s.deadline.at !== null)
    .map((s) => s.deadline.at ?? "");
  const now = useSanctionClock(query.data?.serverNow, deadlines, refresh);
  const eligible = sanctions.find((s) => s.canAppeal);
  const pending = query.data?.appeals.some((a) => a.status === "PENDING");
  const appeal = useMutation({
    mutationFn: () => sanctionsApi.appeal(message.trim()),
    onSuccess: async () => {
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
      mode={mode === "suspended" && query.data && !suspended ? "history" : mode}
      sanctions={sanctions}
      appeals={query.data?.appeals ?? []}
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
