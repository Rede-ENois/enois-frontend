import { PROFILE_HEADER_METADATA_ITEMS } from "@/constants/profile-header-metadata-items";
import { texts } from "@/texts";
import type { ProfileHeaderMetadataProps } from "@/types/components/profile/profile-header-metadata-props";

import { ProfileMetadataItem } from "@/components/profile-metadata-item";
import { ProfileReputationBadge } from "@/components/profile-reputation-badge";

export function ProfileHeaderMetadata({ user }: ProfileHeaderMetadataProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] font-light text-text-subtle">
      {PROFILE_HEADER_METADATA_ITEMS.map((item) => {
        const value = user[item.field];
        return value ? <ProfileMetadataItem key={item.key} icon={item.icon} value={value} /> : null;
      })}
      <span>{texts.profile.connectionsMeta(user.connectionsCount ?? 0)}</span>
      {(user.reputation ?? 0) > 0 && <ProfileReputationBadge reputation={user.reputation ?? 0} />}
    </div>
  );
}
