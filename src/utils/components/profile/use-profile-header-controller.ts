import { useState } from "react";

import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";

import { resolveCdnUrl } from "@/lib/api/media";

import { useProfileHeaderActions } from "@/utils/components/profile/use-profile-header-actions";
import { useProfileMediaEditor } from "@/utils/components/profile/use-profile-media-editor";

export function useProfileHeaderController(user: Profile) {
  const [hoveringAvatar, setHoveringAvatar] = useState(false);
  const [hoveringBanner, setHoveringBanner] = useState(false);
  const actions = useProfileHeaderActions(user);
  const media = useProfileMediaEditor(user);
  const connectionStatus = actions.connectionStatus;

  const cropDialog =
    media.cropImageSrc && media.cropPurpose
      ? {
          open: true,
          onOpenChange: (open: boolean) => {
            if (!open) media.handleCropCancel();
          },
          imageSrc: media.cropImageSrc,
          aspect: media.cropPurpose === "AVATAR" ? 1 : 3,
          title:
            media.cropPurpose === "AVATAR" ? texts.profile.cropAvatar : texts.profile.cropCover,
          onCropComplete: media.handleCropComplete,
        }
      : null;

  return {
    bannerUrl: user.banner ? resolveCdnUrl(user.banner) : null,
    avatarUrl: resolveCdnUrl(user.avatar),
    showEditAction: actions.isOwnProfile,
    showExternalActions: !actions.isOwnProfile,
    bannerArea: {
      onMouseEnter: () => setHoveringBanner(true),
      onMouseLeave: () => setHoveringBanner(false),
    },
    avatarArea: {
      onMouseEnter: () => setHoveringAvatar(true),
      onMouseLeave: () => setHoveringAvatar(false),
    },
    bannerOverlay: {
      visible: actions.isOwnProfile && hoveringBanner,
      disabled: media.bannerUpload.status === "uploading",
      label: media.bannerUpload.status === "uploading" ? texts.common.sending : null,
      openFilePicker: () => media.bannerRef.current?.click(),
    },
    avatarOverlay: {
      visible: actions.isOwnProfile && hoveringAvatar,
      disabled: media.avatarUpload.status === "uploading",
      label:
        media.avatarUpload.status === "uploading" ? texts.profile.uploadingIndicator : null,
      openFilePicker: () => media.avatarRef.current?.click(),
    },
    bannerInput: {
      ref: media.bannerRef,
      onChange: media.handleBannerUpload,
    },
    avatarInput: {
      ref: media.avatarRef,
      onChange: media.handleAvatarUpload,
    },
    message: actions.handleMessage,
    connectionAction: {
      run: actions.handleConnect,
      disabled:
        actions.connectionPending || connectionStatus === "ACCEPTED" || connectionStatus === "PENDING",
      label:
        connectionStatus === "PENDING"
          ? texts.profile.waitingResponse
          : connectionStatus === "ACCEPTED"
            ? texts.profile.connected
            : texts.profile.connect,
    },
    cropDialog,
  };
}
