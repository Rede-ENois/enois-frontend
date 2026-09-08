import { useProfileHeaderMetadataController } from "@/utils/components/profile/use-profile-header-metadata-controller";

import { ProfileMetadataItem } from "@/components/profile-metadata-item";
import { ProfileReputationBadge } from "@/components/profile-reputation-badge";

export function ProfileHeaderMetadata() {
  const { items, connectionsLabel, reputationLabel, showReputation } =
    useProfileHeaderMetadataController();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] font-light text-text-subtle">
      {items.map((item) => (
        <ProfileMetadataItem key={item.key} icon={item.icon} value={item.value} />
      ))}
      <span>{connectionsLabel}</span>
      {showReputation && <ProfileReputationBadge label={reputationLabel} />}
    </div>
  );
}
