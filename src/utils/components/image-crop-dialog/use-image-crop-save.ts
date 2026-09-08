import { useState } from "react";

import { getCroppedImg } from "@/utils/crop-image";
import type { Area } from "react-easy-crop";

export function useImageCropSave(
  imageSrc: string,
  croppedAreaPixels: Area | null,
  onCropComplete: (blob: Blob) => void | Promise<void>,
  close: () => void,
) {
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!croppedAreaPixels) return;

    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      await onCropComplete(blob);
      close();
    } catch {
      // Preserve the existing silent failure behavior.
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    saveDisabled: saving || !croppedAreaPixels,
    save,
  };
}
