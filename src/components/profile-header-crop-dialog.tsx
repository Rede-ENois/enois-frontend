import { useProfileHeaderContext } from "@/utils/components/profile/use-profile-header-context";

import { ImageCropDialog } from "@/components/image-crop-dialog";

export function ProfileHeaderCropDialog() {
  const { cropDialog } = useProfileHeaderContext();

  if (!cropDialog) return null;

  return <ImageCropDialog {...cropDialog} />;
}
