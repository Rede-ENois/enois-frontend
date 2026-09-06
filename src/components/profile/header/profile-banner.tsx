import { Camera } from "lucide-react";

import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";
import type { ProfileBannerProps } from "@/types/components/profile/header/profile-banner-props";

export function ProfileBanner({
  user,
  isEditable,
  isUploading,
  onSelect,
}: ProfileBannerProps) {
  return (
    <div className="group relative">
      {user.banner ? (
        <img src={resolveCdnUrl(user.banner)} alt="" className="h-40 w-full object-cover sm:h-52" />
      ) : (
        <div className="h-40 w-full sm:h-52" style={{ background: "var(--gradient-primary)" }} />
      )}
      {isEditable && (
        <>
          <label htmlFor="profile-banner-upload" className={`absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 text-white opacity-0 transition group-hover:opacity-100 ${isUploading ? "pointer-events-none" : ""}`}>
            {isUploading ? texts.common.sending : <Camera className="h-6 w-6" />}
          </label>
          <input id="profile-banner-upload" type="file" accept="image/*" className="hidden" onChange={onSelect} />
        </>
      )}
    </div>
  );
}
