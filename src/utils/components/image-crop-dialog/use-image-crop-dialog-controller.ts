import { useCallback } from "react";

import type { ImageCropDialogProps } from "@/types/components/image-crop-dialog/image-crop-dialog-props";
import { useImageCropSave } from "@/utils/components/image-crop-dialog/use-image-crop-save";
import { useImageCropState } from "@/utils/components/image-crop-dialog/use-image-crop-state";

export function useImageCropDialogController({
  imageSrc,
  onCropComplete,
  onOpenChange,
}: ImageCropDialogProps) {
  const cropState = useImageCropState();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const saveState = useImageCropSave(imageSrc, cropState.croppedAreaPixels, onCropComplete, close);

  return {
    crop: cropState.crop,
    zoom: cropState.zoom,
    saving: saveState.saving,
    saveDisabled: saveState.saveDisabled,
    handleCropChange: cropState.handleCropChange,
    handleZoomChange: cropState.handleZoomChange,
    handleZoomInputChange: cropState.handleZoomInputChange,
    handleCropAreaChange: cropState.handleCropAreaChange,
    close,
    save: saveState.save,
  };
}
