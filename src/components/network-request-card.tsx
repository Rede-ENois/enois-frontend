import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { RequestCardProps } from "@/types/components/network/request-card-props";
import { useNetworkRequestCardController } from "@/utils/components/network/use-network-request-card-controller";

import { Button } from "@/components/ui/button";

import { UserAvatar } from "@/components/user-avatar";

export function RequestCard(props: RequestCardProps) {
  const { user, profileUsername, statusLabel, actions } = useNetworkRequestCardController(props);

  return (
    <div className="surface-card flex items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar src={user?.avatar} alt={user?.name} className="h-12 w-12 shrink-0" />

        <div className="min-w-0">
          <Link
            to="/perfil/$username"
            params={{ username: profileUsername }}
            className="font-semibold hover:underline"
          >
            {user?.name ?? texts.common.loading}
          </Link>
          {user?.headline && (
            <p className="truncate text-xs text-muted-foreground">{user.headline}</p>
          )}
          <p className="text-[11px] text-muted-foreground">{statusLabel}</p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        {actions.map((action) => {
          const ActionIcon = action.icon;

          return (
            <Button
              key={action.key}
              size="sm"
              variant={action.variant}
              className="rounded-full gap-1.5"
              onClick={action.run}
            >
              <ActionIcon className="h-4 w-4" />

              <>{action.label}</>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
