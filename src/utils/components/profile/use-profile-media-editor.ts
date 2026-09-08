import { useCallback, useRef } from "react";

import type { Profile } from "@/types/application/profile/profile";
import type { ProfileCropPurpose } from "@/types/components/profile/profile-crop-purpose";
import { useProfileMediaUpdater } from "@/utils/components/profile/use-profile-media-updater";

import { useImageCropUpload } from "@/lib/use-image-crop-upload";
import { useMediaUpload } from "@/lib/use-media-upload";

export function useProfileMediaEditor(user: Profile) {
  const upload = useMediaUpload();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const updateProfileMedia = useProfileMediaUpdater(user);

  const uploadCrop = useCallback(
    (purpose: ProfileCropPurpose, file: File) => upload.upload(file, purpose),
    [upload],
  );
  const applyUpload = useCallback(
    async (purpose: ProfileCropPurpose, cdnUrl: string) => {
      const field = purpose === "AVATAR" ? "avatar" : "banner";
      await updateProfileMedia({ [field]: cdnUrl });
    },
    [updateProfileMedia],
  );
  const crop = useImageCropUpload(uploadCrop, applyUpload);

  return {
    avatarRef,
    bannerRef,
    uploadStatus: upload.status,
    cropImageSrc: crop.cropImageSrc,
    cropPurpose: crop.cropPurpose,
    handleAvatarUpload: crop.handleFileSelect("AVATAR"),
    handleBannerUpload: crop.handleFileSelect("BANNER"),
    handleCropComplete: crop.handleCropComplete,
    handleCropCancel: crop.handleCropCancel,
  };
}
