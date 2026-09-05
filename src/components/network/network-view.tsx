import { Link } from "@tanstack/react-router";

import { Check, Send, UserMinus, UserPlus, X } from "lucide-react";

import type { ConnectionRequest, NetworkSummary, NetworkUser, Profile } from "@/lib/api";
import { texts } from "@/texts";
import type { ConnectionUiState, RequestDirection } from "@/utils/network";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";

export type NetworkMatchItem = {
  user: NetworkUser;
  state: ConnectionUiState;
};

export type NetworkRequestItem = {
  request: ConnectionRequest;
  direction: RequestDirection;
  targetUserId: string;
  user?: Profile;
};

export function NetworkOverview({
  summary,
  suggestionsCount,
}: {
  summary: NetworkSummary | undefined;
  suggestionsCount: number;
}) {
  const stats = [
    { label: texts.network.stats.connections, value: summary?.connections ?? 0 },
    { label: texts.network.stats.following, value: summary?.followers ?? 0 },
    { label: texts.network.stats.requests, value: summary?.pendingRequests ?? 0, highlight: true },
    { label: texts.network.stats.suggestions, value: suggestionsCount },
  ];

  return (
    <div className="surface-card p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{texts.network.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{texts.network.description}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <NetworkStat
            key={stat.label}
            label={stat.label}
            value={String(stat.value)}
            highlight={stat.highlight}
          />
        ))}
      </div>
    </div>
  );
}

export function PendingRequests({
  incoming,
  outgoing,
  onAccept,
  onCancel,
}: {
  incoming: NetworkRequestItem[];
  outgoing: NetworkRequestItem[];
  onAccept: (userId: string) => void;
  onCancel: (userId: string) => void;
}) {
  const groups = [
    { direction: "incoming" as const, label: texts.network.received, requests: incoming },
    { direction: "outgoing" as const, label: texts.network.sent, requests: outgoing },
  ];
  const total = incoming.length + outgoing.length;

  if (total === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{texts.network.pendingTitle}</h2>
        <p className="text-sm text-muted-foreground">{texts.network.pendingCount(total)}</p>
      </div>
      <div className="space-y-3">
        {groups.map(({ direction, label, requests }) => {
          if (requests.length === 0) return null;
          return (
            <div
              key={direction}
              className={direction === "outgoing" && incoming.length > 0 ? "pt-3" : ""}
            >
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <div className="space-y-3">
                {requests.map((item) => (
                  <RequestCard
                    key={item.request.id}
                    item={item}
                    onAccept={onAccept}
                    onCancel={onCancel}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function NetworkMatches({
  items,
  pending,
  onConnect,
  onRemove,
}: {
  items: NetworkMatchItem[];
  pending: boolean;
  onConnect: (userId: string) => void;
  onRemove: (userId: string) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">{texts.network.matchesTitle}</h2>
          <p className="text-sm text-muted-foreground">{texts.network.matchesDescription}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ user, state }) => (
          <NetworkUserCard
            key={user.id}
            user={user}
            state={state}
            pending={pending}
            onConnect={onConnect}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}

function NetworkUserCard({
  user,
  state,
  pending,
  onConnect,
  onRemove,
}: {
  user: NetworkUser;
  state: ConnectionUiState;
  pending: boolean;
  onConnect: (userId: string) => void;
  onRemove: (userId: string) => void;
}) {
  const actionMeta: Record<
    ConnectionUiState,
    {
      Icon: React.ElementType;
      label: string;
      variant: "default" | "outline";
      className: string;
      run: () => void;
    }
  > = {
    connected: {
      Icon: UserMinus,
      label: texts.network.remove,
      variant: "outline",
      className: "text-destructive hover:text-destructive",
      run: () => onRemove(user.id),
    },
    requested: {
      Icon: Send,
      label: texts.network.requested,
      variant: "default",
      className: "",
      run: () => onConnect(user.id),
    },
    available: {
      Icon: UserPlus,
      label: texts.network.connect,
      variant: "default",
      className: "",
      run: () => onConnect(user.id),
    },
  };
  const action = actionMeta[state];
  const ActionIcon = action.Icon;

  return (
    <article className="surface-card overflow-hidden text-center">
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
          disabled={pending}
          onClick={action.run}
        >
          <ActionIcon className="h-4 w-4" /> {action.label}
        </Button>
      </div>
    </article>
  );
}

function RequestCard({
  item,
  onAccept,
  onCancel,
}: {
  item: NetworkRequestItem;
  onAccept: (userId: string) => void;
  onCancel: (userId: string) => void;
}) {
  const { request, direction, targetUserId, user } = item;
  const descriptions: Record<RequestDirection, string> = {
    outgoing: texts.network.requestSent,
    incoming: texts.network.wantsToConnect,
  };
  const actions: Record<RequestDirection, React.ReactNode> = {
    outgoing: (
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 rounded-full gap-1.5"
        onClick={() => onCancel(request.toUserId)}
      >
        <X className="h-4 w-4" /> {texts.network.cancel}
      </Button>
    ),
    incoming: (
      <div className="flex shrink-0 gap-2">
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
      <div className="flex min-w-0 items-center gap-3">
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
          <p className="text-[11px] text-muted-foreground">{descriptions[direction]}</p>
        </div>
      </div>
      {actions[direction]}
    </div>
  );
}

function NetworkStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-primary/30 bg-primary-soft" : "border-border bg-muted/40"
      }`}
    >
      <p className={`text-2xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
