import { useCallback, useRef } from "react";

import type { Profile } from "@/types/application/profile/profile";
import type { ProfileCropPurpose } from "@/types/components/profile/profile-crop-purpose";

import { useImageCropUpload } from "@/lib/use-image-crop-upload";
import { useMediaUpload } from "@/lib/use-media-upload";

import { useProfileMediaUpdater } from "@/utils/components/profile/use-profile-media-updater";

export function useProfileMediaEditor(user: Profile) {
  const avatarUpload = useMediaUpload();
  const bannerUpload = useMediaUpload();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const updateProfileMedia = useProfileMediaUpdater(user);

  const uploadCrop = useCallback(
    (purpose: ProfileCropPurpose, file: File) =>
      (purpose === "AVATAR" ? avatarUpload : bannerUpload).upload(file, purpose),
    [avatarUpload, bannerUpload],
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
    avatarUpload,
    bannerUpload,
    cropImageSrc: crop.cropImageSrc,
    cropPurpose: crop.cropPurpose,
    handleAvatarUpload: crop.handleFileSelect("AVATAR"),
    handleBannerUpload: crop.handleFileSelect("BANNER"),
    handleCropComplete: crop.handleCropComplete,
    handleCropCancel: crop.handleCropCancel,
  };
}
