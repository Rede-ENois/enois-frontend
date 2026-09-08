import { ProfileHeaderActions } from "@/components/profile-header-actions";
import { ProfileHeaderAvatar } from "@/components/profile-header-avatar";
import { ProfileHeaderBanner } from "@/components/profile-header-banner";
import { ProfileHeaderCropDialog } from "@/components/profile-header-crop-dialog";
import { ProfileHeaderIdentity } from "@/components/profile-header-identity";

export function ProfileHeader() {
  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
        <ProfileHeaderBanner />

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14 sm:gap-4">
            <ProfileHeaderAvatar />
            <ProfileHeaderActions />
          </div>

          <ProfileHeaderIdentity />
        </div>
      </div>

      <ProfileHeaderCropDialog />
    </>
  );
}
