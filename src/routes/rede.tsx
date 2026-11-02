import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { NetworkUser } from "@/types/application/network/network-user";
import type { NetworkRequestOutcome } from "@/types/lib/network/network-request-outcome";
import type { PersonCardProps } from "@/types/routes/network/person-card-props";
import type { StatProps } from "@/types/routes/network/stat-props";
import type { NetworkRequest } from "@rede-enois/design-system/domain";
import { NetworkRequests, StyledName, UserAvatar } from "@rede-enois/design-system/domain";
import { Button, ConfirmDialog, LoadingState, PageHeader } from "@rede-enois/design-system/ui";
import { Send, UserMinus, UserPlus } from "lucide-react";

import { networkApi } from "@/lib/api";
import { liteInterval } from "@/lib/lite-mode";
import { networkRequests } from "@/lib/network/network-requests";
import { networkQueries } from "@/lib/query-options/network";
import { requireAuth } from "@/lib/require-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

import { AppContainer } from "@/components/app-container";
import { ProfilePeek } from "@/components/profile/profile-peek";

/** Suggestion cards on the page: two rows on desktop. */
const SUGGESTIONS = 6;

export const Route = createFileRoute("/rede")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.network.seoTitle }] }),
  component: Rede,
});

function Rede() {
  const queryClient = useQueryClient();
  // Per suggestion card: the invitation on its way, sent, or failed.
  const [invites, setInvites] = useState<Record<string, "sending" | "sent" | "failed">>({});
  const [removing, setRemoving] = useState<NetworkUser | null>(null);
  // The outcome of each answered invitation, by the other person's id. The row keeps it after the
  // refetch drops the request, so the list never jumps under the cursor.
  const [outcomes, setOutcomes] = useState<Record<string, NetworkRequestOutcome>>({});
  const lite = useLiteMode();

  const { data: usersData } = useQuery({
    queryKey: ["network", "users"],
    queryFn: () => networkApi.list(),
  });
  const { data: summary } = useQuery({
    queryKey: ["network", "summary"],
    queryFn: () => networkApi.summary(),
  });
  const requestsQuery = useQuery({
    ...networkQueries.requests(50),
    refetchInterval: liteInterval(30_000, lite),
  });

  const connections = usersData?.items ?? [];
  const suggestionsQuery = useQuery({
    queryKey: ["network", "suggestions", { limit: SUGGESTIONS }],
    queryFn: () => networkApi.suggestions(SUGGESTIONS),
  });
  const suggestions = suggestionsQuery.data ?? [];
  const requests = networkRequests(requestsQuery.data?.items ?? [], outcomes);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: networkQueries.all });

  /**
   * Answers one row: progress, then its outcome or a failure, then a fresh list. A plain call and
   * not a shared `useMutation`: `mutate` callbacks only fire for the latest call, so answering two
   * invitations in a row left the first one spinning.
   */
  const respond = async (
    userId: string,
    call: (id: string) => Promise<unknown>,
    busy: NetworkRequest["status"],
    done: NetworkRequest["status"],
  ) => {
    const index = requests.findIndex((item) => item.userId === userId);
    if (index < 0) return;
    const row = requests[index];
    const mark = (status: NetworkRequest["status"]) =>
      setOutcomes((current) => ({ ...current, [userId]: { row: { ...row, status }, index } }));
    mark(busy);
    try {
      await call(userId);
      mark(done);
      void invalidate();
    } catch {
      mark("failed");
    }
  };

  /** One call per card, like the invitations: a shared mutation only reports its latest call. */
  const invite = async (userId: string) => {
    setInvites((current) => ({ ...current, [userId]: "sending" }));
    try {
      await networkApi.connect(userId);
      setInvites((current) => ({ ...current, [userId]: "sent" }));
      // The invitation shows up in the "Enviados" tab; the card keeps "Convite enviado".
      void queryClient.invalidateQueries({ queryKey: networkQueries.requests(50).queryKey });
    } catch {
      setInvites((current) => ({ ...current, [userId]: "failed" }));
    }
  };
  const remove = useMutation({
    mutationFn: (id: string) => networkApi.remove(id),
    onSuccess: () => {
      setRemoving(null);
      return invalidate();
    },
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <PageHeader title={texts.network.title} description={texts.network.description}>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat
              label={texts.network.stats.connections}
              value={String(summary?.connections ?? 0)}
            />
            <Stat
              label={texts.network.stats.requests}
              value={String(summary?.pendingRequests ?? 0)}
              highlight={(summary?.pendingRequests ?? 0) > 0}
            />
          </div>
        </PageHeader>

        <NetworkRequests
          requests={requests}
          loading={requestsQuery.isPending}
          error={requestsQuery.isError}
          onRetry={() => requestsQuery.refetch()}
          onAccept={(userId) => respond(userId, networkApi.accept, "accepting", "accepted")}
          onDecline={(userId) => respond(userId, networkApi.remove, "declining", "declined")}
          onCancel={(userId) => respond(userId, networkApi.remove, "cancelling", "cancelled")}
        />

        <section aria-labelledby="network-suggestions-title">
          <div className="mb-3">
            <h2 id="network-suggestions-title" className="text-lg font-semibold">
              {texts.network.suggestionsTitle}
            </h2>

            <p className="text-sm text-muted-foreground">{texts.network.suggestionsDescription}</p>
          </div>

          {suggestionsQuery.isPending ? (
            <LoadingState />
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{texts.network.suggestionsEmpty}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((user) => {
                const state = invites[user.id];
                return (
                  <PersonCard
                    key={user.id}
                    user={user}
                    note={
                      user.mutualConnections ? texts.network.mutual(user.mutualConnections) : null
                    }
                  >
                    {state === "failed" && (
                      <p role="alert" className="mb-2 text-xs text-destructive">
                        {texts.network.connectFailed}
                      </p>
                    )}

                    <Button
                      className="w-full gap-1.5 rounded-full"
                      variant={state === "sent" ? "outline" : "default"}
                      disabled={state === "sending" || state === "sent"}
                      onClick={() => invite(user.id)}
                    >
                      {state === "sent" ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}

                      <>{state === "sent" ? texts.network.requested : texts.network.connect}</>
                    </Button>
                  </PersonCard>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="network-connections-title">
          <h2 id="network-connections-title" className="mb-3 text-lg font-semibold">
            {texts.network.connectionsTitle(connections.length)}
          </h2>

          {connections.length === 0 ? (
            <p className="text-sm text-muted-foreground">{texts.network.connectionsEmpty}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((user) => (
                <PersonCard key={user.id} user={user}>
                  <Button
                    variant="outline"
                    className="w-full gap-1.5 rounded-full text-muted-foreground"
                    onClick={() => setRemoving(user)}
                  >
                    <UserMinus className="h-4 w-4" />

                    <>{texts.network.remove}</>
                  </Button>
                </PersonCard>
              ))}
            </div>
          )}
        </section>

        <ConfirmDialog
          open={removing != null}
          onOpenChange={(next) => {
            if (!next) setRemoving(null);
          }}
          title={texts.network.removeTitle(removing?.name ?? "")}
          description={texts.network.removeDescription}
          confirmLabel={texts.network.remove}
          cancelLabel={texts.network.keep}
          destructive
          pending={remove.isPending}
          onConfirm={() => {
            if (removing) remove.mutate(removing.id);
          }}
        />
      </div>
    </AppContainer>
  );
}

function PersonCard({ user, note, children }: PersonCardProps) {
  return (
    <article className="surface-card min-w-0 overflow-hidden text-center">
      <div className="h-16" style={{ background: "var(--gradient-soft)" }} />

      <div className="-mt-10 min-w-0 px-5 pb-5">
        <ProfilePeek username={user.username} name={user.name} className="mx-auto block">
          <UserAvatar
            src={user.avatar}
            frame={user.avatarFrame}
            alt={user.name}
            className="mx-auto h-20 w-20 ring-4 ring-card"
          />
        </ProfilePeek>

        <ProfilePeek
          username={user.username}
          name={user.name}
          className="mx-auto mt-3 block max-w-full break-words text-center font-semibold hover:underline"
        >
          <StyledName name={user.name} style={user.nameStyle} />
        </ProfilePeek>

        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
          {user.headline}
        </p>

        {/* The line is kept even empty, so the buttons of a row of cards line up. */}
        <p className="mt-2 min-h-4 text-xs text-primary">{note}</p>

        <div className="mt-4">{children}</div>
      </div>
    </article>
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
