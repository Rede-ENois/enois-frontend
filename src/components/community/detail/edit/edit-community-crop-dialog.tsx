import { ImageCropDialog } from "@/components/image-crop-dialog";

type EditCommunityCropDialogProps = {
  crop: { imageSrc: string; aspect: number; title: string } | null;
  onClose: () => void;
  onComplete: (croppedImageBlob: Blob) => Promise<void>;
};

export function EditCommunityCropDialog({
  crop,
  onClose,
  onComplete,
}: EditCommunityCropDialogProps) {
  if (!crop) return null;

  return (
    <ImageCropDialog
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      imageSrc={crop.imageSrc}
      aspect={crop.aspect}
      title={crop.title}
      onCropComplete={onComplete}
    />
  );
}
