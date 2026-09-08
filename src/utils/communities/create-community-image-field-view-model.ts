import { texts } from "@/texts";
import type { CommunityImageFieldProps } from "@/types/components/communities/community-image-field-props";

export function createCommunityImageFieldViewModel({
  purpose,
  value,
  inputRef,
}: CommunityImageFieldProps) {
  const isCover = purpose === "COVER";

  return {
    label: isCover ? texts.communities.detail.cover : texts.communities.detail.avatar,
    addLabel: isCover ? texts.communities.detail.addCover : texts.communities.detail.addAvatar,
    showCoverPreview: Boolean(value) && isCover,
    showAvatarPreview: Boolean(value) && !isCover,
    showAddAction: !value,
    openFilePicker: () => inputRef.current?.click(),
  };
}
