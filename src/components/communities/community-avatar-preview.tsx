import type { CommunityImagePreviewProps } from "@/types/communities/community-image-preview-props";

import { CommunityImageActions } from "@/components/communities/community-image-actions";

export function CommunityAvatarPreview({ value, inputRef, onRemove }: CommunityImagePreviewProps) {
  return (
    <div className="flex items-center gap-3">
      <img src={value} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-border" />

      <div className="flex gap-2">
        <CommunityImageActions inputRef={inputRef} onRemove={onRemove} />
      </div>
    </div>
  );
}
