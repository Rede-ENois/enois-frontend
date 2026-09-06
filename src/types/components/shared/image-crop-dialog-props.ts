export type ImageCropDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  imageSrc: string;
  aspect: number;
  title: string;
  onCropComplete: (croppedImageBlob: Blob) => Promise<void>;
};
