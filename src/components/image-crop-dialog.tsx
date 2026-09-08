import { texts } from "@/texts";
import type { ImageCropDialogProps } from "@/types/components/image-crop-dialog/image-crop-dialog-props";
import { useImageCropDialogController } from "@/utils/components/image-crop-dialog/use-image-crop-dialog-controller";
import { Root as Dialog } from "@radix-ui/react-dialog";
import Cropper from "react-easy-crop";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

export function ImageCropDialog(props: ImageCropDialogProps) {
  const { open, onOpenChange, imageSrc, aspect, title } = props;
  const {
    crop,
    zoom,
    saving,
    saveDisabled,
    handleCropChange,
    handleZoomChange,
    handleZoomInputChange,
    handleCropAreaChange,
    close,
    save,
  } = useImageCropDialogController(props);

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
            onChange={handleZoomInputChange}
            className="flex-1"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-full" onClick={close}>
            {texts.common.cancel}
          </Button>

          <Button className="flex-1 rounded-full" disabled={saveDisabled} onClick={save}>
            {saving ? texts.common.saving : texts.common.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
