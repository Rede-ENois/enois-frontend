import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { RequestCardProps } from "@/types/routes/network/request-card-props";
import type { StatProps } from "@/types/routes/network/stat-props";
import { Check, Send, UserMinus, UserPlus, X } from "lucide-react";

import { networkApi, profileApi } from "@/lib/api";
import { getCurrentUserId } from "@/lib/current-user";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";

import { AppContainer } from "@/components/app-container";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/rede")({
  beforeLoad: requireAuth,
  head: () => ({ meta: buildPageShareTags({ title: texts.network.seoTitle, path: "/rede" }) }),
  component: Rede,
});

function Rede() {
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});

  const { data: usersData } = useQuery({
    queryKey: ["network", "users"],
    queryFn: () => networkApi.list(),
  });
  const { data: summary } = useQuery({
    queryKey: ["network", "summary"],
    queryFn: () => networkApi.summary(),
  });
  const { data: requestsData } = useQuery({
    queryKey: ["network", "requests"],
    queryFn: () => networkApi.requests(),
    refetchInterval: 30_000,
  });

  const users = usersData?.items ?? [];
  const pendingRequests = (requestsData?.items ?? []).filter((r) => r.status === "PENDING");
  const incomingRequests = pendingRequests.filter((r) => r.fromUserId !== currentUserId);
  const outgoingRequests = pendingRequests.filter((r) => r.fromUserId === currentUserId);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["network"] });

  const acceptRequest = useMutation({
    mutationFn: (id: string) => networkApi.accept(id),
    onSuccess: invalidate,
  });
  const connect = useMutation({
    mutationFn: (id: string) => networkApi.connect(id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => networkApi.remove(id),
    onSuccess: invalidate,
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card p-4 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight">{texts.network.title}</h1>

          <p className="mt-1 text-sm text-muted-foreground">{texts.network.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label={texts.network.stats.connections}
              value={String(summary?.connections ?? 0)}
            />
            <Stat label={texts.network.stats.following} value={String(summary?.followers ?? 0)} />
            <Stat
              label={texts.network.stats.requests}
              value={String(summary?.pendingRequests ?? 0)}
              highlight
            />
            <Stat label={texts.network.stats.suggestions} value={String(users.length)} />
          </div>
        </div>

        {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold">{texts.network.pendingTitle}</h2>

              <p className="text-sm text-muted-foreground">
                {texts.network.pendingCount(incomingRequests.length + outgoingRequests.length)}
              </p>
            </div>

            <div className="space-y-3">
              {incomingRequests.length > 0 && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {texts.network.received}
                  </p>
                  {incomingRequests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onAccept={acceptRequest.mutate}
                      onCancel={remove.mutate}
                    />
                  ))}
                </>
              )}
              {outgoingRequests.length > 0 && (
                <>
                  <div className={incomingRequests.length > 0 ? "pt-3" : ""}>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {texts.network.sent}
                    </p>
                  </div>
                  {outgoingRequests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onAccept={acceptRequest.mutate}
                      onCancel={remove.mutate}
                    />
                  ))}
                </>
              )}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">{texts.network.matchesTitle}</h2>

              <p className="text-sm text-muted-foreground">{texts.network.matchesDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <article key={u.id} className="surface-card overflow-hidden text-center">
                <div className="h-16" style={{ background: "var(--gradient-soft)" }} />

                <div className="-mt-10 px-5 pb-5">
                  <UserAvatar
                    src={u.avatar}
                    alt={u.name}
                    className="mx-auto h-20 w-20 ring-4 ring-card"
                  />

                  <Link
                    to="/perfil/$username"
                    params={{ username: u.username }}
                    className="mt-3 block font-semibold hover:underline"
                  >
                    {u.name}
                  </Link>

                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
                    {u.headline}
                  </p>

                  <p className="mt-2 text-xs text-primary">
                    <Check className="mr-1 inline h-3 w-3" />

                    <>{u.connected ? texts.network.connected : texts.network.commonInterests}</>
                  </p>

                  <Button
                    className={`mt-4 w-full rounded-full gap-1.5 ${u.connected ? "text-destructive hover:text-destructive" : ""}`}
                    variant={u.connected ? "outline" : "default"}
                    disabled={connect.isPending || remove.isPending}
                    onClick={() => {
                      if (u.connected) {
                        remove.mutate(u.id);
                        setLocalStatus((s) => ({ ...s, [u.id]: "REMOVED" }));
                      } else {
                        connect.mutate(u.id);
                        setLocalStatus((s) => ({ ...s, [u.id]: "REQUESTED" }));
                      }
                    }}
                  >
                    {u.connected ? (
                      <>
                        <UserMinus className="h-4 w-4" />

                        <>{texts.network.remove}</>
                      </>
                    ) : localStatus[u.id] === "REQUESTED" ? (
                      <>
                        <Send className="h-4 w-4" />

                        <>{texts.network.requested}</>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />

                        <>{texts.network.connect}</>
                      </>
                    )}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppContainer>
  );
}

function RequestCard({ request, onAccept, onCancel }: RequestCardProps) {
  const currentUserId = getCurrentUserId();
  const isOutgoing = request.fromUserId === currentUserId;
  const targetUserId = isOutgoing ? request.toUserId : request.fromUserId;

  const { data: user } = useQuery({
    queryKey: ["profile", "by-id", targetUserId],
    queryFn: () => profileApi.getById(targetUserId),
  });

  return (
    <div className="surface-card flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar src={user?.avatar} alt={user?.name} className="h-12 w-12 shrink-0" />

        <div className="min-w-0">
          <Link
            to="/perfil/$username"
            params={{ username: user?.username ?? targetUserId }}
            className="font-semibold hover:underline"
          >
            {user?.name ?? texts.common.loading}
          </Link>
          {user?.headline && (
            <p className="truncate text-xs text-muted-foreground">{user.headline}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {isOutgoing ? texts.network.requestSent : texts.network.wantsToConnect}
          </p>
        </div>
      </div>
      {isOutgoing ? (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full shrink-0 gap-1.5"
          onClick={() => onCancel(request.toUserId)}
        >
          <X className="h-4 w-4" />

          <>{texts.network.cancel}</>
        </Button>
      ) : (
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5"
            onClick={() => onCancel(request.fromUserId)}
          >
            <X className="h-4 w-4" />

            <>{texts.network.reject}</>
          </Button>

          <Button
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => onAccept(request.fromUserId)}
          >
            <Check className="h-4 w-4" />

            <>{texts.network.accept}</>
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: StatProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${highlight ? "border-primary/30 bg-primary-soft" : "border-border bg-muted/40"}`}
    >
      <p className={`text-2xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>

      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
