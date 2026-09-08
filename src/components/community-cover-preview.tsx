import type { CommunityImagePreviewProps } from "@/types/components/communities/community-image-preview-props";

import { CommunityImageActions } from "@/components/community-image-actions";

export function CommunityCoverPreview({ value, inputRef, onRemove }: CommunityImagePreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <img src={value} alt="" className="h-24 w-full object-cover" />

      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition hover:opacity-100">
        <CommunityImageActions inputRef={inputRef} onRemove={onRemove} />
      </div>
    </div>
  );
}
