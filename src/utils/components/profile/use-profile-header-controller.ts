import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";

import { resolveCdnUrl } from "@/lib/api/media";

import { createProfileConnectionAction } from "@/utils/components/profile/create-profile-connection-action";
import { createProfileCropDialog } from "@/utils/components/profile/create-profile-crop-dialog";
import { createProfileMediaOverlay } from "@/utils/components/profile/create-profile-media-overlay";
import { useProfileHeaderActions } from "@/utils/components/profile/use-profile-header-actions";
import { useProfileHeaderHover } from "@/utils/components/profile/use-profile-header-hover";
import { useProfileMediaEditor } from "@/utils/components/profile/use-profile-media-editor";

export function useProfileHeaderController(user: Profile) {
  const hover = useProfileHeaderHover();
  const actions = useProfileHeaderActions(user);
  const media = useProfileMediaEditor(user);

  return {
    bannerUrl: user.banner ? resolveCdnUrl(user.banner) : null,
    avatarUrl: resolveCdnUrl(user.avatar),
    showEditAction: actions.isOwnProfile,
    showExternalActions: !actions.isOwnProfile,
    bannerArea: hover.bannerArea,
    avatarArea: hover.avatarArea,
    bannerOverlay: createProfileMediaOverlay(
      actions.isOwnProfile,
      hover.hoveringBanner,
      media.bannerUpload.status === "uploading",
      texts.common.sending,
      () => media.bannerRef.current?.click(),
    ),
    avatarOverlay: createProfileMediaOverlay(
      actions.isOwnProfile,
      hover.hoveringAvatar,
      media.avatarUpload.status === "uploading",
      texts.profile.uploadingIndicator,
      () => media.avatarRef.current?.click(),
    ),
    bannerInput: {
      ref: media.bannerRef,
      onChange: media.handleBannerUpload,
    },
    avatarInput: {
      ref: media.avatarRef,
      onChange: media.handleAvatarUpload,
    },
    message: actions.handleMessage,
    connectionAction: createProfileConnectionAction(
      actions.connectionStatus,
      actions.connectionPending,
      actions.handleConnect,
    ),
    cropDialog: createProfileCropDialog(
      media.cropImageSrc,
      media.cropPurpose,
      media.handleCropCancel,
      media.handleCropComplete,
    ),
  };
}
