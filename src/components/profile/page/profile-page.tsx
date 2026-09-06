import { texts } from "@/texts";
import type { ProfilePageProps } from "@/types/components/profile/page/profile-page-props";

import { AppContainer } from "@/components/app-container";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileMainContent } from "@/components/profile/profile-main-content";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";

import { useProfilePageActions } from "./use-profile-page-actions";
import { useProfilePageData } from "./use-profile-page-data";

export function ProfilePage({ loaderUser }: ProfilePageProps) {
  const profileData = useProfilePageData(loaderUser);
  const profileActions = useProfilePageActions(
    profileData.user,
    profileData.connectionStatus,
  );

  return (
    <AppContainer>
      <div className="space-y-6">
        <ProfileHeader
          user={profileData.user}
          isOwnProfile={profileData.isOwnProfile}
          isAvatarUploading={profileActions.isAvatarUploading}
          isBannerUploading={profileActions.isBannerUploading}
          connectionLabel={profileActions.connectionLabel}
          isConnectionDisabled={profileActions.isConnectionDisabled}
          onAvatarSelect={profileActions.handleAvatarSelect}
          onBannerSelect={profileActions.handleBannerSelect}
          onMessage={profileActions.handleMessage}
          onConnect={profileActions.handleConnect}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ProfileMainContent user={profileData.user} posts={profileData.posts} />
          <ProfileSidebar
            user={profileData.user}
            isOwnProfile={profileData.isOwnProfile}
            recommendations={profileData.recommendations}
            recommenderByUserId={profileData.recommenderByUserId}
            ranking={profileData.ranking}
            isRecommendationOpen={profileActions.isRecommendationOpen}
            recommendationComment={profileActions.recommendationComment}
            isRecommendationPending={profileActions.isRecommendationPending}
            onRecommendationOpenChange={profileActions.setIsRecommendationOpen}
            onRecommendationCommentChange={profileActions.setRecommendationComment}
            onRecommendationSubmit={profileActions.handleRecommendationSubmit}
          />
        </div>
      </div>
      <div className="h-4 lg:hidden" />

      {profileActions.cropImageSrc && profileActions.cropPurpose && (
        <ImageCropDialog
          isOpen={Boolean(profileActions.cropImageSrc)}
          onOpenChange={(isOpen) => {
            if (!isOpen) profileActions.resetCrop();
          }}
          imageSrc={profileActions.cropImageSrc}
          aspect={profileActions.cropPurpose === "AVATAR" ? 1 : 3}
          title={
            profileActions.cropPurpose === "AVATAR"
              ? texts.profile.cropAvatar
              : texts.profile.cropCover
          }
          onCropComplete={profileActions.handleCropComplete}
        />
      )}
    </AppContainer>
  );
}
