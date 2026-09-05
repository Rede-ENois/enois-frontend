import type { ChangeEventHandler } from "react";

import { Camera } from "lucide-react";

import type { Profile } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";

import { UserAvatar } from "@/components/user-avatar";

export function ProfileAvatar({ user, editable, uploading, onSelect }: {
  user: Profile;
  editable: boolean;
  uploading: boolean;
  onSelect: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="group relative">
      <UserAvatar src={resolveCdnUrl(user.avatar)} alt={user.name} className="h-24 w-24 ring-4 ring-surface-card sm:h-28 sm:w-28" />
      {editable && (
        <>
          <label htmlFor="profile-avatar-upload" className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition group-hover:opacity-100 ${uploading ? "pointer-events-none" : ""}`}>
            {uploading ? "..." : <Camera className="h-5 w-5" />}
          </label>
          <input id="profile-avatar-upload" type="file" accept="image/*" className="hidden" onChange={onSelect} />
        </>
      )}
    </div>
  );
}
