import { Camera } from "lucide-react";

import { useProfileHeaderContext } from "@/utils/components/profile/use-profile-header-context";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { UserAvatar } from "@/components/user-avatar";

export function ProfileHeaderAvatar() {
  const { user } = useProfilePageContext();
  const { avatarUrl, avatarArea, avatarOverlay, avatarInput } = useProfileHeaderContext();

  return (
    <div className="relative" {...avatarArea}>
      <UserAvatar
        src={avatarUrl}
        alt={user.name}
        className="h-24 w-24 ring-4 ring-surface-card sm:h-28 sm:w-28"
      />

      {avatarOverlay.visible && (
        <button
          type="button"
          onClick={avatarOverlay.openFilePicker}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white transition"
          disabled={avatarOverlay.disabled}
        >
          {avatarOverlay.label ?? <Camera className="h-5 w-5" />}
        </button>
      )}

      <input
        ref={avatarInput.ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={avatarInput.onChange}
      />
    </div>
  );
}
