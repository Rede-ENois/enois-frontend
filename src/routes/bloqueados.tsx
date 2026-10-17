import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ShieldOff, Undo2 } from "lucide-react";

import { networkApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

import { AppContainer } from "@/components/app-container";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/bloqueados")({
  head: () => ({
    meta: buildPageShareTags({ title: texts.profile.blockedSeoTitle, path: "/bloqueados" }),
  }),
  component: BlockedUsers,
});

function BlockedUsers() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: () => networkApi.blocked(),
  });

  const unblock = useMutation({
    mutationFn: (userId: string) => networkApi.unblock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const users = data ?? [];

  return (
    <AppContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-normal tracking-tight text-text-strong">
            {texts.profile.blockedTitle}
          </h1>

          <p className="mt-1 text-sm font-normal text-text-subtle">
            {texts.profile.blockedDescription}
          </p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-border-soft bg-surface-card">
            <EmptyState icon={ShieldOff} title={texts.profile.blockedEmpty} />
          </div>
        ) : (
          <ul className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
            {users.map((user) => (
              <li key={user.userId} className="flex items-center gap-3 px-4 py-3">
                <UserAvatar
                  src={user.avatar}
                  alt={user.name ?? texts.profile.avatarFallback}
                  className="h-10 w-10 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  {user.username ? (
                    <Link
                      to="/perfil/$username"
                      params={{ username: user.username }}
                      className="truncate text-sm font-normal text-text-strong hover:underline"
                    >
                      {user.name ?? user.username}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-normal text-text-strong">
                      {user.name ?? texts.profile.avatarUnknown}
                    </span>
                  )}

                  <p className="text-xs font-normal text-text-subtle">
                    {texts.profile.blockedSince(user.blockedAt)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full gap-1.5"
                  disabled={unblock.isPending}
                  onClick={() => {
                    // Sem sessão o requireAuth joga para o login e o desbloqueio não acontece.
                    requireAuth();
                    unblock.mutate(user.userId);
                  }}
                >
                  <Undo2 className="h-4 w-4" />

                  <>{texts.profile.unblockUser}</>
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="flex items-center gap-2 text-xs font-normal text-text-subtle">
          <ShieldOff className="h-4 w-4 shrink-0" />

          <>{texts.profile.blockedHint}</>
        </p>
      </div>
    </AppContainer>
  );
}
