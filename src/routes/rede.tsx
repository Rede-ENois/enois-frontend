import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Check, Send, UserMinus, UserPlus, X } from "lucide-react";

import { type ConnectionRequest, networkApi, profileApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import {
  getConnectionUiState,
  getRequestDirection,
  getRequestTargetUserId,
  type ConnectionUiState,
  type RequestDirection,
} from "@/utils/network";

import { Button } from "@/components/ui/button";

import { AppContainer } from "@/components/app-container";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/rede")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.network.seoTitle }] }),
  component: Rede,
});

function Rede() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
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
  const pendingRequests = (requestsData?.items ?? []).filter((request) => request.status === "PENDING");
  const requestGroups: Record<RequestDirection, ConnectionRequest[]> = {
    incoming: pendingRequests.filter((request) => request.fromUserId !== currentUser?.id),
    outgoing: pendingRequests.filter((request) => request.fromUserId === currentUser?.id),
  };

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

  const connectionActions: Record<
    ConnectionUiState,
    {
      Icon: React.ElementType;
      label: string;
      variant: "default" | "outline";
      className: string;
      run: (userId: string) => void;
    }
  > = {
    connected: {
      Icon: UserMinus,
      label: texts.network.remove,
      variant: "outline",
      className: "text-destructive hover:text-destructive",
      run: (userId) => {
        remove.mutate(userId);
        setLocalStatus((status) => ({ ...status, [userId]: "REMOVED" }));
      },
    },
    requested: {
      Icon: Send,
      label: texts.network.requested,
      variant: "default",
      className: "",
      run: (userId) => connect.mutate(userId),
    },
    available: {
      Icon: UserPlus,
      label: texts.network.connect,
      variant: "default",
      className: "",
      run: (userId) => {
        connect.mutate(userId);
        setLocalStatus((status) => ({ ...status, [userId]: "REQUESTED" }));
      },
    },
  };

  const totalPending = requestGroups.incoming.length + requestGroups.outgoing.length;

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card p-4 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight">{texts.network.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{texts.network.description}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={texts.network.stats.connections} value={String(summary?.connections ?? 0)} />
            <Stat label={texts.network.stats.following} value={String(summary?.followers ?? 0)} />
            <Stat
              label={texts.network.stats.requests}
              value={String(summary?.pendingRequests ?? 0)}
              highlight
            />
            <Stat label={texts.network.stats.suggestions} value={String(users.length)} />
          </div>
        </div>

        {totalPending > 0 && (
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold">{texts.network.pendingTitle}</h2>
              <p className="text-sm text-muted-foreground">{texts.network.pendingCount(totalPending)}</p>
            </div>
            <div className="space-y-3">
              {(
                [
                  ["incoming", texts.network.received],
                  ["outgoing", texts.network.sent],
                ] as const
              ).map(([direction, label]) => {
                const requests = requestGroups[direction];
                if (requests.length === 0) return null;

                return (
                  <div key={direction} className={direction === "outgoing" && requestGroups.incoming.length > 0 ? "pt-3" : ""}>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {label}
                    </p>
                    <div className="space-y-3">
                      {requests.map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          currentUserId={currentUser?.id ?? ""}
                          onAccept={acceptRequest.mutate}
                          onCancel={remove.mutate}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => {
              const state = getConnectionUiState(user.connected, localStatus[user.id]);
              const action = connectionActions[state];
              const ActionIcon = action.Icon;

              return (
                <article key={user.id} className="surface-card overflow-hidden text-center">
                  <div className="h-16" style={{ background: "var(--gradient-soft)" }} />
                  <div className="-mt-10 px-5 pb-5">
                    <UserAvatar
                      src={user.avatar}
                      alt={user.name}
                      className="mx-auto h-20 w-20 ring-4 ring-card"
                    />
                    <Link
                      to="/perfil/$username"
                      params={{ username: user.username }}
                      className="mt-3 block font-semibold hover:underline"
                    >
                      {user.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
                      {user.headline}
                    </p>
                    <p className="mt-2 text-xs text-primary">
                      <Check className="mr-1 inline h-3 w-3" />
                      {user.connected ? texts.network.connected : texts.network.commonInterests}
                    </p>
                    <Button
                      className={`mt-4 w-full rounded-full gap-1.5 ${action.className}`}
                      variant={action.variant}
                      disabled={connect.isPending || remove.isPending}
                      onClick={() => action.run(user.id)}
                    >
                      <ActionIcon className="h-4 w-4" /> {action.label}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AppContainer>
  );
}

function RequestCard({
  request,
  currentUserId,
  onAccept,
  onCancel,
}: {
  request: ConnectionRequest;
  currentUserId: string;
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const direction = getRequestDirection(request, currentUserId);
  const targetUserId = getRequestTargetUserId(request, direction);

  const { data: user } = useQuery({
    queryKey: ["profile", "by-id", targetUserId],
    queryFn: () => profileApi.getById(targetUserId),
  });

  const descriptions: Record<RequestDirection, string> = {
    outgoing: texts.network.requestSent,
    incoming: texts.network.wantsToConnect,
  };

  const actions: Record<RequestDirection, React.ReactNode> = {
    outgoing: (
      <Button
        size="sm"
        variant="outline"
        className="rounded-full shrink-0 gap-1.5"
        onClick={() => onCancel(request.toUserId)}
      >
        <X className="h-4 w-4" /> {texts.network.cancel}
      </Button>
    ),
    incoming: (
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-1.5"
          onClick={() => onCancel(request.fromUserId)}
        >
          <X className="h-4 w-4" /> {texts.network.reject}
        </Button>
        <Button
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => onAccept(request.fromUserId)}
        >
          <Check className="h-4 w-4" /> {texts.network.accept}
        </Button>
      </div>
    ),
  };

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
          {user?.headline && <p className="truncate text-xs text-muted-foreground">{user.headline}</p>}
          <p className="text-[11px] text-muted-foreground">{descriptions[direction]}</p>
        </div>
      </div>
      {actions[direction]}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${highlight ? "border-primary/30 bg-primary-soft" : "border-border bg-muted/40"}`}
    >
      <p className={`text-2xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
