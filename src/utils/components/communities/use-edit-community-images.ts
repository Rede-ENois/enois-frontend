import { useCallback, useRef } from "react";

import { texts } from "@/texts";
import type { CommunityCropPurpose } from "@/types/components/communities/community-crop-purpose";

import { useImageCropUpload } from "@/lib/use-image-crop-upload";
import { useMediaUpload } from "@/lib/use-media-upload";

export function useEditCommunityImages(
  form: { cover: string; avatar: string },
  setField: (field: "cover" | "avatar", value: string) => void,
) {
  const coverUpload = useMediaUpload();
  const avatarUpload = useMediaUpload();
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const uploadCrop = useCallback(
    (purpose: CommunityCropPurpose, file: File) =>
      (purpose === "COVER" ? coverUpload : avatarUpload).upload(file, purpose),
    [avatarUpload, coverUpload],
  );
  const applyUpload = useCallback(
    (purpose: CommunityCropPurpose, cdnUrl: string) =>
      setField(purpose === "COVER" ? "cover" : "avatar", cdnUrl),
    [setField],
  );
  const crop = useImageCropUpload(uploadCrop, applyUpload);

  return {
    coverField: {
      purpose: "COVER" as const,
      value: form.cover,
      inputRef: coverRef,
      onChange: crop.handleFileSelect("COVER"),
      onRemove: () => setField("cover", ""),
    },
    avatarField: {
      purpose: "AVATAR" as const,
      value: form.avatar,
      inputRef: avatarRef,
      onChange: crop.handleFileSelect("AVATAR"),
      onRemove: () => setField("avatar", ""),
    },
    cropDialog:
      crop.cropImageSrc && crop.cropPurpose
        ? {
            open: true,
            onOpenChange: (open: boolean) => {
              if (!open) crop.handleCropCancel();
            },
            imageSrc: crop.cropImageSrc,
            aspect: crop.cropPurpose === "COVER" ? 3 : 1,
            title:
              crop.cropPurpose === "COVER"
                ? texts.communities.detail.cropCover
                : texts.communities.detail.cropAvatar,
            onCropComplete: crop.handleCropComplete,
          }
        : null,
  };
}
