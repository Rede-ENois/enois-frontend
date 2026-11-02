import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ProfilePeekCardProps } from "@/types/components/profile/profile-peek-card-props";
import type { ProfilePeekProps } from "@/types/components/profile/profile-peek-props";
import { ProfileMiniCard } from "@rede-enois/design-system/domain";
import {
  Button,
  LoadingState,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@rede-enois/design-system/ui";

import { profileCardData } from "@/lib/cosmetics";
import { profileQueries } from "@/lib/query-options/profiles";
import { cn } from "@/lib/utils";

const PEEK_STALE_MS = 60_000;
/** Same 16px gutter as the page: the card never touches the screen edge on a phone. */
const PEEK_EDGE_PX = 16;

/** Loads the public profile only when the popover opens; shares the profile page cache. */
function ProfilePeekCard({ username, userId }: ProfilePeekCardProps) {
  const profile = useQuery({
    ...profileQueries.byUsernameOrId(username, userId),
    staleTime: PEEK_STALE_MS,
  });

  if (profile.isPending) {
    return (
      <div className="p-4">
        <LoadingState />
      </div>
    );
  }
  if (profile.isError) {
    return (
      <div className="space-y-3 p-4 text-sm text-text-subtle" role="alert">
        <p>{texts.cosmetics.peek.loadError}</p>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => void profile.refetch()}
        >
          {texts.cosmetics.peek.retry}
        </Button>
      </div>
    );
  }
  return (
    <ProfileMiniCard
      profile={profileCardData(profile.data)}
      href={`/perfil/${encodeURIComponent(profile.data.username)}`}
    />
  );
}

/** Avatar or name of a person that opens their mini profile card in a popover. */
export function ProfilePeek({ username, userId, name, children, className }: ProfilePeekProps) {
  const [open, setOpen] = useState(false);
  if (!username && !userId) return <>{children}</>;
  const label = texts.cosmetics.peek.open(name);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={label}
          aria-label={label}
          className={cn(
            "min-w-0 max-w-full rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            className,
          )}
        >
          {children}
        </button>
      </PopoverTrigger>

      <PopoverContent
        collisionPadding={PEEK_EDGE_PX}
        className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl p-0"
      >
        {open && <ProfilePeekCard username={username} userId={userId} />}
      </PopoverContent>
    </Popover>
  );
}
