import { PROFILE_HEADER_BADGES } from "@/constants/profile-header-badges";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { ProfileStatusBadge } from "@/components/profile-status-badge";

export function ProfileHeaderName() {
  const { user } = useProfilePageContext();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h1 className="break-words text-[22px] font-light tracking-tight text-text-strong">
        {user.name}
      </h1>
      {PROFILE_HEADER_BADGES.map(
        (badge) =>
          user[badge.field] && (
            <ProfileStatusBadge key={badge.key} label={badge.label} className={badge.className} />
          ),
      )}
    </div>
  );
}
