import { Briefcase, MapPin } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileHeaderMetadataProps } from "@/types/components/profile/profile-header-metadata-props";

import { ProfileMetadataItem } from "@/components/profile-metadata-item";
import { ProfileReputationBadge } from "@/components/profile-reputation-badge";

export function ProfileHeaderMetadata({ user }: ProfileHeaderMetadataProps) {
  const metadata = [
    { key: "company", value: user.company, icon: Briefcase },
    { key: "location", value: user.location, icon: MapPin },
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] font-light text-text-subtle">
      {metadata.map(
        (item) =>
          item.value && (
            <ProfileMetadataItem key={item.key} icon={item.icon} value={item.value} />
          ),
      )}
      <span>{texts.profile.connectionsMeta(user.connectionsCount ?? 0)}</span>
      {(user.reputation ?? 0) > 0 && <ProfileReputationBadge reputation={user.reputation ?? 0} />}
    </div>
  );
}
