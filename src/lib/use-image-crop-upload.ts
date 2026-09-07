import { type ChangeEvent, useCallback, useState } from "react";

import type { UploadResult } from "@/types/media-upload/upload-result";

export function useImageCropUpload<TPurpose extends string>(
  uploadCrop: (purpose: TPurpose, file: File) => Promise<UploadResult>,
  onUploaded: (purpose: TPurpose, cdnUrl: string) => void | Promise<void>,
) {
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPurpose, setCropPurpose] = useState<TPurpose | null>(null);

  const handleFileSelect = (purpose: TPurpose) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCropPurpose(purpose);
    setCropImageSrc(URL.createObjectURL(file));
    event.target.value = "";
  };

  const clearCrop = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);

  const handleCropComplete = useCallback(
    async (blob: Blob) => {
      if (!cropPurpose) return;

      const result = await uploadCrop(
        cropPurpose,
        new File([blob], "crop.jpg", { type: "image/jpeg" }),
      );
      await onUploaded(cropPurpose, result.cdnUrl);
      clearCrop();
    },
    [clearCrop, cropPurpose, onUploaded, uploadCrop],
  );

  return {
    cropImageSrc,
    cropPurpose,
    handleFileSelect,
    handleCropComplete,
    handleCropCancel: clearCrop,
  };
}
