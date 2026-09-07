import { type ChangeEvent, useCallback, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProfile as updateProfileRequest } from "@/lib/api/profile/update-profile";
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
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPurpose, setCropPurpose] = useState<ProfileCropPurpose | null>(null);

  const updateProfile = useMutation({
    mutationFn: (data: Pick<UpdateProfileRequest, "avatar" | "banner">) => updateProfileRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
    },
  });

  const startCrop = (purpose: ProfileCropPurpose, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCropImageSrc(URL.createObjectURL(file));
    setCropPurpose(purpose);
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    startCrop("AVATAR", event);
  };

  const handleBannerUpload = (event: ChangeEvent<HTMLInputElement>) => {
    startCrop("BANNER", event);
  };

  const handleCropComplete = useCallback(
    async (blob: Blob) => {
      const upload = cropPurpose === "AVATAR" ? avatarUpload : bannerUpload;
      const result = await upload.upload(
        new File([blob], "crop.jpg", { type: "image/jpeg" }),
        cropPurpose!,
      );
      const field = cropPurpose === "AVATAR" ? "avatar" : "banner";
      await updateProfile.mutateAsync({ [field]: result.cdnUrl });
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
      setCropPurpose(null);
    },
    [avatarUpload, bannerUpload, cropImageSrc, cropPurpose, updateProfile],
  );

  const handleCropCancel = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);

  return {
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
  };
}
