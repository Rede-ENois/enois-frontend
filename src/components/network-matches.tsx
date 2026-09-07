import { Link } from "@tanstack/react-router";

import { Check, Send, UserMinus, UserPlus } from "lucide-react";

import { useNetworkMatchesController } from "@/lib/use-network-matches-controller";
import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function NetworkMatches() {
  const { users, localStatus, pending, toggleConnection } = useNetworkMatchesController();

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">{texts.network.matchesTitle}</h2>
          <p className="text-sm text-muted-foreground">{texts.network.matchesDescription}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
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
                <>{user.connected ? texts.network.connected : texts.network.commonInterests}</>
              </p>
              <Button
                className={`mt-4 w-full rounded-full gap-1.5 ${
                  user.connected ? "text-destructive hover:text-destructive" : ""
                }`}
                variant={user.connected ? "outline" : "default"}
                disabled={pending}
                onClick={() => toggleConnection(user.id, user.connected)}
              >
                {user.connected ? (
                  <>
                    <UserMinus className="h-4 w-4" /><>{texts.network.remove}</>
                  </>
                ) : localStatus[user.id] === "REQUESTED" ? (
                  <>
                    <Send className="h-4 w-4" /><>{texts.network.requested}</>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /><>{texts.network.connect}</>
                  </>
                )}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
