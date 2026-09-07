import { type ChangeEvent, useCallback, useState } from "react";

import type { Area, Point } from "react-easy-crop";

import type { ImageCropDialogProps } from "@/types/components/image-crop-dialog/image-crop-dialog-props";

import { getCroppedImg } from "@/utils/crop-image";

export function useImageCropDialogController({
  imageSrc,
  onCropComplete,
  onOpenChange,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCropChange = useCallback((location: Point) => setCrop(location), []);
  const handleZoomChange = useCallback((value: number) => setZoom(value), []);
  const handleZoomInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setZoom(Number(event.target.value));
  }, []);
  const handleCropAreaChange = useCallback((_: Area, area: Area) => {
    setCroppedAreaPixels(area);
  }, []);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

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
    crop,
    zoom,
    saving,
    saveDisabled: saving || !croppedAreaPixels,
    handleCropChange,
    handleZoomChange,
    handleZoomInputChange,
    handleCropAreaChange,
    close,
    save,
  };
}
