import { useState } from "react";

import { Briefcase, Camera, MapPin, MessageCircle, Settings } from "lucide-react";

import { resolveCdnUrl } from "@/lib/api/media";
import { useProfileHeaderActions } from "@/lib/use-profile-header-actions";
import { useProfileMediaEditor } from "@/lib/use-profile-media-editor";
import { texts } from "@/texts";
import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [hoveringAvatar, setHoveringAvatar] = useState(false);
  const [hoveringBanner, setHoveringBanner] = useState(false);
  const {
    isOwnProfile,
    connectionStatus,
    connectionPending,
    handleMessage,
    handleConnect,
  } = useProfileHeaderActions(user);
  const {
    avatarRef,
    bannerRef,
    avatarUpload,
    bannerUpload,
    cropImageSrc,
    cropPurpose,
    handleAvatarUpload,
    handleBannerUpload,
    handleCropComplete,
    handleCropCancel,
  } = useProfileMediaEditor(user);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
        <div
          className="relative"
          onMouseEnter={() => setHoveringBanner(true)}
          onMouseLeave={() => setHoveringBanner(false)}
        >
          {user.banner ? (
            <img src={resolveCdnUrl(user.banner)} alt="" className="h-40 w-full object-cover sm:h-52" />
          ) : (
            <div className="h-40 w-full sm:h-52" style={{ background: "var(--gradient-primary)" }} />
          )}
          {isOwnProfile && hoveringBanner && (
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition"
              disabled={bannerUpload.status === "uploading"}
            >
              {bannerUpload.status === "uploading" ? texts.common.sending : <Camera className="h-6 w-6" />}
            </button>
          )}
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerUpload}
          />
        </div>

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14 sm:gap-4">
            <div
              className="relative"
              onMouseEnter={() => setHoveringAvatar(true)}
              onMouseLeave={() => setHoveringAvatar(false)}
            >
              <UserAvatar
                src={resolveCdnUrl(user.avatar)}
                alt={user.name}
                className="h-24 w-24 ring-4 ring-surface-card sm:h-28 sm:w-28"
              />
              {isOwnProfile && hoveringAvatar && (
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white transition"
                  disabled={avatarUpload.status === "uploading"}
                >
                  {avatarUpload.status === "uploading" ? (
                    texts.profile.uploadingIndicator
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
              )}
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <EditProfileDialog profile={user}>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                    <Settings className="h-4 w-4" /><>{texts.profile.editProfile}</>
                  </Button>
                </EditProfileDialog>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="h-4 w-4" /><>{texts.profile.message}</>
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={handleConnect}
                    disabled={
                      connectionPending ||
                      connectionStatus === "ACCEPTED" ||
                      connectionStatus === "PENDING"
                    }
                  >
                    {connectionStatus === "PENDING"
                      ? texts.profile.waitingResponse
                      : connectionStatus === "ACCEPTED"
                        ? texts.profile.connected
                        : texts.profile.connect}
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
                  <Briefcase className="h-4 w-4" /><>{user.company}</>
                </span>
              )}
              {user.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /><>{user.location}</>
                </span>
              )}
              <span>{texts.profile.connectionsMeta(user.connectionsCount)}</span>
              {(user.reputation ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-opportunity/15 px-2 py-0.5 text-[11px] font-light text-opportunity-foreground">
                  {texts.profile.reputationMeta(user.reputation ?? 0)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {cropImageSrc && cropPurpose && (
        <ImageCropDialog
          open={!!cropImageSrc}
          onOpenChange={(open) => {
            if (!open) handleCropCancel();
          }}
          imageSrc={cropImageSrc}
          aspect={cropPurpose === "AVATAR" ? 1 : 3}
          title={cropPurpose === "AVATAR" ? texts.profile.cropAvatar : texts.profile.cropCover}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
