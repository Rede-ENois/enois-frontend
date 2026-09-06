import { Camera } from "lucide-react";

import { resolveCdnUrl } from "@/lib/api/media";
import type { ProfileAvatarProps } from "@/types/components/profile/header/profile-avatar-props";

import { UserAvatar } from "@/components/user-avatar";

export function ProfileAvatar({
  user,
  isEditable,
  isUploading,
  onSelect,
}: ProfileAvatarProps) {
  return (
    <div className="group relative">
      <UserAvatar src={resolveCdnUrl(user.avatar)} alt={user.name} className="h-24 w-24 ring-4 ring-surface-card sm:h-28 sm:w-28" />
      {isEditable && (
        <>
          <label htmlFor="profile-avatar-upload" className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition group-hover:opacity-100 ${isUploading ? "pointer-events-none" : ""}`}>
            {isUploading ? "..." : <Camera className="h-5 w-5" />}
          </label>
          <input id="profile-avatar-upload" type="file" accept="image/*" className="hidden" onChange={onSelect} />
        </>
      )}
    </div>
  );
}
