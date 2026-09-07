import { useProfilePageController } from "@/utils/components/profile/use-profile-page-controller";

import { AppContainer } from "@/components/app-container";
import { ProfileAboutSection } from "@/components/profile-about-section";
import { ProfileGoalsSection } from "@/components/profile-goals-section";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileRecentPostsSection } from "@/components/profile-recent-posts-section";
import { ProfileSidebar } from "@/components/profile-sidebar";
import { ProfileSkillsSection } from "@/components/profile-skills-section";

export function Profile() {
  const { user } = useProfilePageController();

  return (
    <AppContainer>
      <div className="space-y-6">
        <ProfileHeader user={user} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <ProfileAboutSection user={user} />
            <ProfileSkillsSection user={user} />
            <ProfileGoalsSection user={user} />
            <ProfileRecentPostsSection user={user} />
          </div>

          <ProfileSidebar user={user} />
        </div>
      </div>

      <div className="h-4 lg:hidden" />
    </AppContainer>
  );
}
