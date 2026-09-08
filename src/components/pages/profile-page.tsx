import { AppContainer } from "@/components/app-container";
import { ProfileAboutSection } from "@/components/profile-about-section";
import { ProfileGoalsSection } from "@/components/profile-goals-section";
import { ProfileHeaderProvider } from "@/components/profile-header-provider";
import { ProfileRecentPostsSection } from "@/components/profile-recent-posts-section";
import { ProfileSidebar } from "@/components/profile-sidebar";
import { ProfileSkillsSection } from "@/components/profile-skills-section";

export function Profile() {
  return (
    <AppContainer>
      <div className="space-y-6">
        <ProfileHeaderProvider />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <ProfileAboutSection />
            <ProfileSkillsSection />
            <ProfileGoalsSection />
            <ProfileRecentPostsSection />
          </div>

          <ProfileSidebar />
        </div>
      </div>

      <div className="h-4 lg:hidden" />
    </AppContainer>
  );
}
