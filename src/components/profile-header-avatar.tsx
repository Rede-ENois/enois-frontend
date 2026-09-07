import { Camera } from "lucide-react";

import type { ProfileHeaderMediaProps } from "@/types/components/profile/profile-header-media-props";

import { UserAvatar } from "@/components/user-avatar";

export function ProfileHeaderAvatar({ imageUrl, alt, area, overlay, input }: ProfileHeaderMediaProps) {
  return (
    <div className="relative" {...area}>
      <UserAvatar
        src={imageUrl}
        alt={alt}
        className="h-24 w-24 ring-4 ring-surface-card sm:h-28 sm:w-28"
      />

      {overlay.visible && (
        <button
          type="button"
          onClick={overlay.openFilePicker}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white transition"
          disabled={overlay.disabled}
        >
          {overlay.label ?? <Camera className="h-5 w-5" />}
        </button>
      )}

      <input
        ref={input.ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={input.onChange}
      />
    </div>
  );
}
