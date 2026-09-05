import type { ChangeEventHandler } from "react";

import { Briefcase, Camera, MapPin, MessageCircle, Settings } from "lucide-react";

import type { Profile } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";

import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";

type ProfileHeaderProps = {
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
};

export function ProfileHeader({
  user,
  isOwnProfile,
  avatarUploading,
  bannerUploading,
  connectionLabel,
  connectionDisabled,
  onAvatarSelect,
  onBannerSelect,
  onMessage,
  onConnect,
}: ProfileHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
      <div className="group relative">
        {user.banner ? (
          <img
            src={resolveCdnUrl(user.banner)}
            alt=""
            className="h-40 w-full object-cover sm:h-52"
          />
        ) : (
          <div
            className="h-40 w-full sm:h-52"
            style={{ background: "var(--gradient-primary)" }}
          />
        )}
        {isOwnProfile && (
          <>
            <label
              htmlFor="profile-banner-upload"
              className={`absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 text-white opacity-0 transition group-hover:opacity-100 ${
                bannerUploading ? "pointer-events-none" : ""
              }`}
            >
              {bannerUploading ? texts.common.sending : <Camera className="h-6 w-6" />}
            </label>
            <input
              id="profile-banner-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onBannerSelect}
            />
          </>
        )}
      </div>

      <div className="px-4 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14 sm:gap-4">
          <div className="group relative">
            <UserAvatar
              src={resolveCdnUrl(user.avatar)}
              alt={user.name}
              className="h-24 w-24 ring-4 ring-surface-card sm:h-28 sm:w-28"
            />
            {isOwnProfile && (
              <>
                <label
                  htmlFor="profile-avatar-upload"
                  className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition group-hover:opacity-100 ${
                    avatarUploading ? "pointer-events-none" : ""
                  }`}
                >
                  {avatarUploading ? "..." : <Camera className="h-5 w-5" />}
                </label>
                <input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarSelect}
                />
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwnProfile ? (
              <EditProfileDialog profile={user}>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                  <Settings className="h-4 w-4" /> {texts.profile.editProfile}
                </Button>
              </EditProfileDialog>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={onMessage}
                >
                  <MessageCircle className="h-4 w-4" /> {texts.profile.message}
                </Button>
                <Button
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={onConnect}
                  disabled={connectionDisabled}
                >
                  {connectionLabel}
                </Button>
              </>
            )}
          </div>
        </div>

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
                <Briefcase className="h-4 w-4" /> {user.company}
              </span>
            )}
            {user.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {user.location}
              </span>
            )}
            <span>· {texts.profile.connections(user.connectionsCount ?? 0)}</span>
            {(user.reputation ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-opportunity/15 px-2 py-0.5 text-[11px] font-light text-opportunity-foreground">
                ★ {texts.profile.reputation(user.reputation ?? 0)}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
