import { Camera } from "lucide-react";

import type { ProfileHeaderMediaEditControlsProps } from "@/types/components/profile/profile-header-media-edit-controls-props";

export function ProfileHeaderMediaEditControls({
  overlay,
  input,
  overlayClassName,
  iconClassName,
}: ProfileHeaderMediaEditControlsProps) {
  return (
    <>
      {overlay.visible && (
        <button
          type="button"
          onClick={overlay.openFilePicker}
          className={overlayClassName}
          disabled={overlay.disabled}
        >
          {overlay.label ?? <Camera className={iconClassName} />}
        </button>
      )}

      <input
        ref={input.ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={input.onChange}
      />
    </>
  );
}
