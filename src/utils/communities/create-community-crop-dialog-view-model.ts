import { texts } from "@/texts";
import type { CommunityCropPurpose } from "@/types/components/communities/community-crop-purpose";
import type { ImageCropDialogProps } from "@/types/components/image-crop-dialog/image-crop-dialog-props";

export function createCommunityCropDialogViewModel(
  imageSrc: string | null,
  purpose: CommunityCropPurpose | null,
  onCancel: () => void,
  onCropComplete: (blob: Blob) => Promise<void>,
): ImageCropDialogProps | null {
  if (!imageSrc || !purpose) return null;

  const isCover = purpose === "COVER";

  return {
    open: true,
    onOpenChange: (open) => {
      if (!open) onCancel();
    },
    imageSrc,
    aspect: isCover ? 3 : 1,
    title: isCover ? texts.communities.detail.cropCover : texts.communities.detail.cropAvatar,
    onCropComplete,
  };
}
