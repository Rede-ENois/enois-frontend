import { Camera } from "lucide-react";

import { useProfileHeaderContext } from "@/utils/components/profile/use-profile-header-context";

export function ProfileHeaderBanner() {
  const { bannerUrl, bannerArea, bannerOverlay, bannerInput } = useProfileHeaderContext();

  return (
    <div className="relative" {...bannerArea}>
      {bannerUrl ? (
        <img src={bannerUrl} alt="" className="h-40 w-full object-cover sm:h-52" />
      ) : (
        <div className="h-40 w-full sm:h-52" style={{ background: "var(--gradient-primary)" }} />
      )}

      {bannerOverlay.visible && (
        <button
          type="button"
          onClick={bannerOverlay.openFilePicker}
          className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition"
          disabled={bannerOverlay.disabled}
        >
          {bannerOverlay.label ?? <Camera className="h-6 w-6" />}
        </button>
      )}

      <input
        ref={bannerInput.ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={bannerInput.onChange}
      />
    </div>
  );
}
