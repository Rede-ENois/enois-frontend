import { Camera } from "lucide-react";

import type { ProfileHeaderMediaProps } from "@/types/components/profile/profile-header-media-props";

export function ProfileHeaderBanner({ imageUrl, area, overlay, input }: ProfileHeaderMediaProps) {
  return (
    <div className="relative" {...area}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-40 w-full object-cover sm:h-52" />
      ) : (
        <div
          className="h-40 w-full sm:h-52"
          style={{ background: "var(--gradient-primary)" }}
        />
      )}

      {overlay.visible && (
        <button
          type="button"
          onClick={overlay.openFilePicker}
          className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition"
          disabled={overlay.disabled}
        >
          {overlay.label ?? <Camera className="h-6 w-6" />}
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
