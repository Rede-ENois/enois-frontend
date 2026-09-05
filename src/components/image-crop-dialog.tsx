import { useCallback, useState } from "react";

import Cropper, { type Area } from "react-easy-crop";

import { texts } from "@/texts";
import { cropImage } from "@/utils/images";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect,
  title,
  onCropComplete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imageSrc: string;
  aspect: number;
  title: string;
  onCropComplete: (blob: Blob) => Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropChange = useCallback((location: { x: number; y: number }) => setCrop(location), []);
  const onZoomChange = useCallback((value: number) => setZoom(value), []);
  const onCropAreaChange = useCallback((_: Area, pixels: Area) => setCroppedAreaPixels(pixels), []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setSaving(true);
    try {
      const blob = await cropImage(imageSrc, croppedAreaPixels);
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
