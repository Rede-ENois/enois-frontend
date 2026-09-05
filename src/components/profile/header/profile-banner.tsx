import type { ChangeEventHandler } from "react";

import { Camera } from "lucide-react";

import type { Profile } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";

export function ProfileBanner({ user, editable, uploading, onSelect }: {
  user: Profile;
  editable: boolean;
  uploading: boolean;
  onSelect: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="group relative">
      {user.banner ? (
        <img src={resolveCdnUrl(user.banner)} alt="" className="h-40 w-full object-cover sm:h-52" />
      ) : (
        <div className="h-40 w-full sm:h-52" style={{ background: "var(--gradient-primary)" }} />
      )}
      {editable && (
        <>
          <label htmlFor="profile-banner-upload" className={`absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 text-white opacity-0 transition group-hover:opacity-100 ${uploading ? "pointer-events-none" : ""}`}>
            {uploading ? texts.common.sending : <Camera className="h-6 w-6" />}
          </label>
          <input id="profile-banner-upload" type="file" accept="image/*" className="hidden" onChange={onSelect} />
        </>
      )}
    </div>
  );
}
