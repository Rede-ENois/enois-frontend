import { ImageCropDialog } from "@/components/image-crop-dialog";
import type { EditCommunityCropDialogProps } from "@/types/components/community/edit-community-crop-dialog-props";

export function EditCommunityCropDialog({ crop, onClose, onComplete }: EditCommunityCropDialogProps) {
  if (!crop) return null;
  return <ImageCropDialog isOpen onOpenChange={(isOpen) => { if (!isOpen) onClose(); }} imageSrc={crop.imageSrc} aspect={crop.aspect} title={crop.title} onCropComplete={onComplete} />;
}
