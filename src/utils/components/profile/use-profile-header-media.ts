import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";

import { resolveCdnUrl } from "@/lib/api/media";

import { createProfileCropDialog } from "@/utils/components/profile/create-profile-crop-dialog";
import { createProfileMediaOverlay } from "@/utils/components/profile/create-profile-media-overlay";
import { useProfileHeaderHover } from "@/utils/components/profile/use-profile-header-hover";
import { useProfileMediaEditor } from "@/utils/components/profile/use-profile-media-editor";

export function useProfileHeaderMedia(user: Profile, editable: boolean) {
  const hover = useProfileHeaderHover();
  const media = useProfileMediaEditor(user);
  const avatarUploading = media.cropPurpose === "AVATAR" && media.uploadStatus === "uploading";
  const bannerUploading = media.cropPurpose === "BANNER" && media.uploadStatus === "uploading";

  return {
    bannerUrl: user.banner ? resolveCdnUrl(user.banner) : null,
    avatarUrl: resolveCdnUrl(user.avatar),
    bannerArea: hover.bannerArea,
    avatarArea: hover.avatarArea,
    bannerOverlay: createProfileMediaOverlay(
      editable,
      hover.hoveringBanner,
      bannerUploading,
      texts.common.sending,
      () => media.bannerRef.current?.click(),
    ),
    avatarOverlay: createProfileMediaOverlay(
      editable,
      hover.hoveringAvatar,
      avatarUploading,
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
    cropDialog: createProfileCropDialog(
      media.cropImageSrc,
      media.cropPurpose,
      media.handleCropCancel,
      media.handleCropComplete,
    ),
  };
}
