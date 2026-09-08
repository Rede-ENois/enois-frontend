import { useProfileHeaderController } from "@/utils/components/profile/use-profile-header-controller";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { ImageCropDialog } from "@/components/image-crop-dialog";
import { ProfileHeaderActions } from "@/components/profile-header-actions";
import { ProfileHeaderAvatar } from "@/components/profile-header-avatar";
import { ProfileHeaderBanner } from "@/components/profile-header-banner";
import { ProfileHeaderIdentity } from "@/components/profile-header-identity";

export function ProfileHeader() {
  const { user } = useProfilePageContext();
  const controller = useProfileHeaderController();

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
        <ProfileHeaderBanner
          imageUrl={controller.bannerUrl}
          area={controller.bannerArea}
          overlay={controller.bannerOverlay}
          input={controller.bannerInput}
        />

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14 sm:gap-4">
            <ProfileHeaderAvatar
              imageUrl={controller.avatarUrl}
              alt={user.name}
              area={controller.avatarArea}
              overlay={controller.avatarOverlay}
              input={controller.avatarInput}
            />
            <ProfileHeaderActions />
          </div>

          <ProfileHeaderIdentity />
        </div>
      </div>

      {controller.cropDialog && <ImageCropDialog {...controller.cropDialog} />}
    </>
  );
}
