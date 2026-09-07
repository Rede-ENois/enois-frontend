import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { acceptConnection } from "@/lib/api/network/accept-connection";
import { listConnectionRequests } from "@/lib/api/network/list-connection-requests";
import { removeConnection } from "@/lib/api/network/remove-connection";
import { getCurrentUserId } from "@/lib/current-user";
import { texts } from "@/texts";

import { RequestCard } from "@/components/network-request-card";

export function NetworkRequests() {
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();

  const { data: requestsData } = useQuery({
    queryKey: ["network", "requests"],
    queryFn: () => listConnectionRequests(),
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
    mutationFn: acceptConnection,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: removeConnection,
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
