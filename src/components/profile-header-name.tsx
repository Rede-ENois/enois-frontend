import { texts } from "@/texts";
import type { ProfileHeaderNameProps } from "@/types/components/profile/profile-header-name-props";

import { ProfileStatusBadge } from "@/components/profile-status-badge";

export function ProfileHeaderName({ user }: ProfileHeaderNameProps) {
  const badges = [
    {
      key: "open-to-work",
      visible: user.openToWork,
      label: texts.profile.openToWork,
      className: "text-growth",
    },
    {
      key: "mentor",
      visible: user.isMentor,
      label: texts.profile.mentorAvailable,
      className: "text-primary",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h1 className="break-words text-[22px] font-light tracking-tight text-text-strong">
        {user.name}
      </h1>
      {badges.map(
        (badge) =>
          badge.visible && (
            <ProfileStatusBadge
              key={badge.key}
              label={badge.label}
              className={badge.className}
            />
          ),
      )}
    </div>
  );
}
