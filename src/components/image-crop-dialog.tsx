import { useCallback, useState } from "react";

import { texts } from "@/texts";
import type { ImageCropDialogProps } from "@/types/components/image-crop-dialog/image-crop-dialog-props";
import { getCroppedImg } from "@/utils/crop-image";
import { Root as Dialog } from "@radix-ui/react-dialog";
import Cropper, { type Area, type Point } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect,
  title,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropChange = useCallback((location: Point) => setCrop(location), []);
  const onZoomChange = useCallback((z: number) => setZoom(z), []);

  const onCropAreaChange = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      await onCropComplete(blob);
      onOpenChange(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
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
            disabled={saving || !croppedAreaPixels}
            onClick={handleSave}
          >
            {saving ? texts.common.saving : texts.common.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
