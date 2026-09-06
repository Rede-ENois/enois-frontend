import type { ControlledDialogProps } from "./controlled-dialog-props";

export type ImageCropDialogProps = ControlledDialogProps & {
  imageSrc: string;
  aspect: number;
  title: string;
  onCropComplete: (croppedImageBlob: Blob) => Promise<void>;
};
