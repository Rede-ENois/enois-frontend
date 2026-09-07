import { useCallback, useRef } from "react";

import type { CommunityCropPurpose } from "@/types/components/communities/community-crop-purpose";

import { useImageCropUpload } from "@/lib/use-image-crop-upload";
import { useMediaUpload } from "@/lib/use-media-upload";

import { createCommunityCropDialogViewModel } from "@/utils/components/communities/create-community-crop-dialog-view-model";
import { createCommunityImageField } from "@/utils/components/communities/create-community-image-field";

export function useEditCommunityImages(
  form: { cover: string; avatar: string },
  setField: (field: "cover" | "avatar", value: string) => void,
) {
  const { upload } = useMediaUpload();
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const uploadCrop = useCallback(
    (purpose: CommunityCropPurpose, file: File) => upload(file, purpose),
    [upload],
  );
  const applyUpload = useCallback(
    (purpose: CommunityCropPurpose, cdnUrl: string) =>
      setField(purpose === "COVER" ? "cover" : "avatar", cdnUrl),
    [setField],
  );
  const crop = useImageCropUpload(uploadCrop, applyUpload);

  return {
    coverField: createCommunityImageField(
      "COVER",
      form.cover,
      coverRef,
      crop.handleFileSelect,
      setField,
    ),
    avatarField: createCommunityImageField(
      "AVATAR",
      form.avatar,
      avatarRef,
      crop.handleFileSelect,
      setField,
    ),
    cropDialog: createCommunityCropDialogViewModel(
      crop.cropImageSrc,
      crop.cropPurpose,
      crop.handleCropCancel,
      crop.handleCropComplete,
    ),
  };
}
