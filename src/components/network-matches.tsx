import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Check } from "lucide-react";

import { useNetworkMatchesController } from "@/utils/components/network/use-network-matches-controller";

import { Button } from "@/components/ui/button";

import { UserAvatar } from "@/components/user-avatar";

export function NetworkMatches() {
  const { users } = useNetworkMatchesController();

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">{texts.network.matchesTitle}</h2>

          <p className="text-sm text-muted-foreground">{texts.network.matchesDescription}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const ActionIcon = user.connectionAction.icon;

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

                  <>{user.statusLabel}</>
                </p>

                <Button
                  className={`mt-4 w-full rounded-full gap-1.5 ${user.connectionAction.className}`}
                  variant={user.connectionAction.variant}
                  disabled={user.connectionAction.disabled}
                  onClick={user.connectionAction.run}
                >
                  <ActionIcon className="h-4 w-4" />

                  <>{user.connectionAction.label}</>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
