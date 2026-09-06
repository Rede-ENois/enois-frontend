import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Check, X } from "lucide-react";

import { networkApi } from "@/lib/api/network";
import { profileApi } from "@/lib/api/profile";
import { getCurrentUserId } from "@/lib/current-user";
import { texts } from "@/texts";
import type { RequestCardProps } from "@/types/components/network/request-card-props";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function NetworkRequests() {
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();

  const { data: requestsData } = useQuery({
    queryKey: ["network", "requests"],
    queryFn: () => networkApi.requests(),
    refetchInterval: 30_000,
  });

  const pendingRequests = (requestsData?.items ?? []).filter(
    (request) => request.status === "PENDING",
  );
  const incomingRequests = pendingRequests.filter(
    (request) => request.fromUserId !== currentUserId,
  );
  const outgoingRequests = pendingRequests.filter(
    (request) => request.fromUserId === currentUserId,
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["network"] });

  const acceptRequest = useMutation({
    mutationFn: (id: string) => networkApi.accept(id),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => networkApi.remove(id),
    onSuccess: invalidate,
  });

  if (incomingRequests.length === 0 && outgoingRequests.length === 0) return null;

  return (
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
            {incomingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
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
            {outgoingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={acceptRequest.mutate}
                onCancel={remove.mutate}
              />
            ))}
          </>
        )}
      </div>
    </section>
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
          <p className="text-[11px] text-muted-foreground">
            {isOutgoing ? texts.network.requestSent : texts.network.wantsToConnect}
          </p>
        </div>
      </div>

      {isOutgoing ? (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 rounded-full gap-1.5"
          onClick={() => onCancel(request.toUserId)}
        >
          <X className="h-4 w-4" /><>{texts.network.cancel}</>
        </Button>
      ) : (
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5"
            onClick={() => onCancel(request.fromUserId)}
          >
            <X className="h-4 w-4" /><>{texts.network.reject}</>
          </Button>
          <Button
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => onAccept(request.fromUserId)}
          >
            <Check className="h-4 w-4" /><>{texts.network.accept}</>
          </Button>
        </div>
      )}
    </div>
  );
}
