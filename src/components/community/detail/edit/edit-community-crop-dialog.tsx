import { ImageCropDialog } from "@/components/image-crop-dialog";

export function EditCommunityCropDialog({ crop, onClose, onComplete }: {
  crop: { imageSrc: string; aspect: number; title: string } | null;
  onClose: () => void;
  onComplete: (blob: Blob) => Promise<void>;
}) {
  if (!crop) return null;

  return (
    <ImageCropDialog
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      imageSrc={crop.imageSrc}
      aspect={crop.aspect}
      title={crop.title}
      onCropComplete={onComplete}
    />
  );
}
