import type { Profile } from "@/lib/api";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileMainContent } from "@/components/profile/profile-main-content";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";

import { useProfilePageActions } from "./use-profile-page-actions";
import { useProfilePageData } from "./use-profile-page-data";

export function ProfilePage({ loaderUser }: { loaderUser: Profile }) {
  const data = useProfilePageData(loaderUser);
  const actions = useProfilePageActions(data.user, data.connectionStatus);

  return (
    <AppContainer>
      <div className="space-y-6">
        <ProfileHeader
          user={data.user}
          isOwnProfile={data.isOwnProfile}
          avatarUploading={actions.avatarUploading}
          bannerUploading={actions.bannerUploading}
          connectionLabel={actions.connectionLabel}
          connectionDisabled={actions.connectionDisabled}
          onAvatarSelect={actions.handleAvatarSelect}
          onBannerSelect={actions.handleBannerSelect}
          onMessage={actions.handleMessage}
          onConnect={actions.handleConnect}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ProfileMainContent user={data.user} posts={data.posts} />
          <ProfileSidebar
            user={data.user}
            isOwnProfile={data.isOwnProfile}
            recommendations={data.recommendations}
            recommenders={data.recommenders}
            ranking={data.ranking}
            recommendationOpen={actions.recommendOpen}
            recommendationComment={actions.recommendComment}
            recommendationPending={actions.recommendationPending}
            onRecommendationOpenChange={actions.setRecommendOpen}
            onRecommendationCommentChange={actions.setRecommendComment}
            onRecommendationSubmit={actions.submitRecommendation}
          />
        </div>
      </div>
      <div className="h-4 lg:hidden" />

      {actions.cropImageSrc && actions.cropPurpose && (
        <ImageCropDialog
          open
          onOpenChange={(open) => { if (!open) actions.resetCrop(); }}
          imageSrc={actions.cropImageSrc}
          aspect={actions.cropPurpose === "AVATAR" ? 1 : 3}
          title={actions.cropPurpose === "AVATAR" ? texts.profile.cropAvatar : texts.profile.cropCover}
          onCropComplete={actions.handleCropComplete}
        />
      )}
    </AppContainer>
  );
}
