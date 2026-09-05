import type { ChangeEventHandler } from "react";

import type { Profile } from "@/lib/api";

import { ProfileActions } from "./header/profile-actions";
import { ProfileAvatar } from "./header/profile-avatar";
import { ProfileBanner } from "./header/profile-banner";
import { ProfileIdentity } from "./header/profile-identity";

export function ProfileHeader({ user, isOwnProfile, avatarUploading, bannerUploading, connectionLabel, connectionDisabled, onAvatarSelect, onBannerSelect, onMessage, onConnect }: {
  user: Profile;
  isOwnProfile: boolean;
  avatarUploading: boolean;
  bannerUploading: boolean;
  connectionLabel: string;
  connectionDisabled: boolean;
  onAvatarSelect: ChangeEventHandler<HTMLInputElement>;
  onBannerSelect: ChangeEventHandler<HTMLInputElement>;
  onMessage: () => void;
  onConnect: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
      <ProfileBanner user={user} editable={isOwnProfile} uploading={bannerUploading} onSelect={onBannerSelect} />
      <div className="px-4 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14 sm:gap-4">
          <ProfileAvatar user={user} editable={isOwnProfile} uploading={avatarUploading} onSelect={onAvatarSelect} />
          <div className="flex flex-wrap gap-2">
            <ProfileActions
              user={user}
              isOwnProfile={isOwnProfile}
              connectionLabel={connectionLabel}
              connectionDisabled={connectionDisabled}
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
