import { useProfileHeaderContext } from "@/utils/components/profile/use-profile-header-context";

import { ProfileHeaderMediaEditControls } from "@/components/profile-header-media-edit-controls";

export function ProfileHeaderBanner() {
  const { bannerUrl, bannerArea, bannerOverlay, bannerInput } = useProfileHeaderContext();

  return (
    <div className="relative" {...bannerArea}>
      {bannerUrl ? (
        <img src={bannerUrl} alt="" className="h-40 w-full object-cover sm:h-52" />
      ) : (
        <div className="h-40 w-full sm:h-52" style={{ background: "var(--gradient-primary)" }} />
      )}

      <ProfileHeaderMediaEditControls
        overlay={bannerOverlay}
        input={bannerInput}
        overlayClassName="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition"
        iconClassName="h-6 w-6"
      />
    </div>
  );
}
