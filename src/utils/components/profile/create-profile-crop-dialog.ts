import { texts } from "@/texts";
import type { ProfileCropPurpose } from "@/types/components/profile/profile-crop-purpose";

export function createProfileCropDialog(
  imageSrc: string | null,
  purpose: ProfileCropPurpose | null,
  cancel: () => void,
  complete: (blob: Blob) => Promise<void>,
) {
  if (!imageSrc || !purpose) return null;

  return {
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) cancel();
    },
    imageSrc,
    aspect: purpose === "AVATAR" ? 1 : 3,
    title: purpose === "AVATAR" ? texts.profile.cropAvatar : texts.profile.cropCover,
    onCropComplete: complete,
  };
}
