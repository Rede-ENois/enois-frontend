import type { CommunityCrop } from "./community-crop";

export type EditCommunityCropDialogProps = {
  crop: CommunityCrop | null;
  onClose: () => void;
  onComplete: (croppedImageBlob: Blob) => Promise<void>;
};
