import { Briefcase, MapPin } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

export function ProfileHeaderIdentity({ user }: ProfileHeaderProps) {
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="break-words text-[22px] font-light tracking-tight text-text-strong">
          {user.name}
        </h1>

        {user.openToWork && (
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-light text-growth">
            {texts.profile.openToWork}
          </span>
        )}

        {user.isMentor && (
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-light text-primary">
            {texts.profile.mentorAvailable}
          </span>
        )}
      </div>

      <p className="mt-1 break-words text-[14px] font-light text-primary">{user.headline}</p>

      <p className="mt-3 flex flex-wrap items-center gap-4 text-[13px] font-light text-text-subtle">
        {user.company && (
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" />

            <>{user.company}</>
          </span>
        )}

        {user.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />

            <>{user.location}</>
          </span>
        )}

        <span>{texts.profile.connectionsMeta(user.connectionsCount ?? 0)}</span>

        {(user.reputation ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-opportunity/15 px-2 py-0.5 text-[11px] font-light text-opportunity-foreground">
            {texts.profile.reputationMeta(user.reputation ?? 0)}
          </span>
        )}
      </p>
    </div>
  );
}
