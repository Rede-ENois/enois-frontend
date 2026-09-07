import { useCallback, useRef } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProfile as updateProfileRequest } from "@/lib/api/profile/update-profile";
import { useImageCropUpload } from "@/lib/use-image-crop-upload";
import { useMediaUpload } from "@/lib/use-media-upload";
import type { Profile } from "@/types/application/profile/profile";
import type { UpdateProfileRequest } from "@/types/application/profile/update-profile-request";
import type { ProfileCropPurpose } from "@/types/components/profile/profile-crop-purpose";

export function useProfileMediaEditor(user: Profile) {
  const queryClient = useQueryClient();
  const avatarUpload = useMediaUpload();
  const bannerUpload = useMediaUpload();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const updateProfile = useMutation({
    mutationFn: (data: Pick<UpdateProfileRequest, "avatar" | "banner">) => updateProfileRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
    },
  });

  const uploadCrop = useCallback(
    (purpose: ProfileCropPurpose, file: File) =>
      (purpose === "AVATAR" ? avatarUpload : bannerUpload).upload(file, purpose),
    [avatarUpload, bannerUpload],
  );

  const applyUpload = useCallback(
    async (purpose: ProfileCropPurpose, cdnUrl: string) => {
      const field = purpose === "AVATAR" ? "avatar" : "banner";
      await updateProfile.mutateAsync({ [field]: cdnUrl });
    },
    [updateProfile],
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
