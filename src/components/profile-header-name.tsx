import { useProfileHeaderNameController } from "@/utils/components/profile/use-profile-header-name-controller";

import { ProfileStatusBadge } from "@/components/profile-status-badge";

export function ProfileHeaderName() {
  const { name, badges } = useProfileHeaderNameController();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h1 className="break-words text-[22px] font-light tracking-tight text-text-strong">{name}</h1>
      {badges.map((badge) => (
        <ProfileStatusBadge key={badge.key} label={badge.label} className={badge.className} />
      ))}
    </div>
  );
}
