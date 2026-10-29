import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { UserAvatar } from "@rede-enois/design-system/domain";
import { Button, EmptyState, LoadingState } from "@rede-enois/design-system/ui";
import { Undo2, VolumeX } from "lucide-react";

import { networkApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/silenciados")({
  head: () => ({ meta: [{ title: texts.profile.mutedSeoTitle }] }),
  component: MutedUsers,
});

function MutedUsers() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["muted-users"],
    queryFn: () => networkApi.muted(),
  });

  const unmute = useMutation({
    mutationFn: (userId: string) => networkApi.unmute(userId),
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
            {texts.profile.mutedTitle}
          </h1>

          <p className="mt-1 text-sm font-normal text-text-subtle">
            {texts.profile.mutedDescription}
          </p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-border-soft bg-surface-card">
            <EmptyState icon={VolumeX} title={texts.profile.mutedEmpty} />
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
                    {texts.profile.mutedSince(user.mutedAt)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full gap-1.5"
                  disabled={unmute.isPending}
                  onClick={() => {
                    requireAuth();
                    unmute.mutate(user.userId);
                  }}
                >
                  <Undo2 className="h-4 w-4" />

                  <>{texts.profile.unmute}</>
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="flex items-center gap-2 text-xs font-normal text-text-subtle">
          <VolumeX className="h-4 w-4 shrink-0" />

          <>{texts.profile.mutedHint}</>
        </p>
      </div>
    </AppContainer>
  );
}
