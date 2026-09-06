import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

import { ProfileActions } from "./header/profile-actions";
import { ProfileAvatar } from "./header/profile-avatar";
import { ProfileBanner } from "./header/profile-banner";
import { ProfileIdentity } from "./header/profile-identity";

export function ProfileHeader({
  user,
  isOwnProfile,
  isAvatarUploading,
  isBannerUploading,
  connectionLabel,
  isConnectionDisabled,
  onAvatarSelect,
  onBannerSelect,
  onMessage,
  onConnect,
}: ProfileHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
      <ProfileBanner
        user={user}
        isEditable={isOwnProfile}
        isUploading={isBannerUploading}
        onSelect={onBannerSelect}
      />
      <div className="px-4 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14 sm:gap-4">
          <ProfileAvatar
            user={user}
            isEditable={isOwnProfile}
            isUploading={isAvatarUploading}
            onSelect={onAvatarSelect}
          />
          <div className="flex flex-wrap gap-2">
            <ProfileActions
              user={user}
              isOwnProfile={isOwnProfile}
              connectionLabel={connectionLabel}
              isConnectionDisabled={isConnectionDisabled}
              onMessage={onMessage}
              onConnect={onConnect}
            />
          </div>
        </div>
        <ProfileIdentity user={user} />
      </div>
    </div>
  );
}
