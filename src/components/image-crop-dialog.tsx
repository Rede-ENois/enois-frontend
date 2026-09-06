import { useCallback, useState } from "react";

import Cropper, { type Area } from "react-easy-crop";

import { texts } from "@/texts";
import { cropImage } from "@/utils/images";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ImageCropDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  imageSrc: string;
  aspect: number;
  title: string;
  onCropComplete: (croppedImageBlob: Blob) => Promise<void>;
};

export function ImageCropDialog({
  isOpen,
  onOpenChange,
  imageSrc,
  aspect,
  title,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCropChange = useCallback(
    (location: { x: number; y: number }) => setCrop(location),
    [],
  );
  const handleZoomChange = useCallback((zoomValue: number) => setZoom(zoomValue), []);
  const handleCropAreaChange = useCallback(
    (_croppedArea: Area, nextCroppedAreaPixels: Area) =>
      setCroppedAreaPixels(nextCroppedAreaPixels),
    [],
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsSaving(true);
    try {
      const croppedImageBlob = await cropImage(imageSrc, croppedAreaPixels);
      await onCropComplete(croppedImageBlob);
      onOpenChange(false);
    } catch {
      // Keep the existing silent-failure behavior.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative h-80 w-full overflow-hidden rounded-xl bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={handleCropChange}
            onZoomChange={handleZoomChange}
            onCropComplete={handleCropAreaChange}
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="flex-1"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            {texts.common.cancel}
          </Button>
          <Button
            className="flex-1 rounded-full"
            disabled={isSaving || !croppedAreaPixels}
            onClick={handleSave}
          >
            {isSaving ? texts.common.saving : texts.common.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
