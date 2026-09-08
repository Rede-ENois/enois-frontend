import { texts } from "@/texts";
import { createProfileAboutSectionViewModel } from "@/utils/components/profile/create-profile-about-section-view-model";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { ProfileSection } from "@/components/profile-section";

export function ProfileAboutSection() {
  const { user } = useProfilePageContext();
  const { visible, bio } = createProfileAboutSectionViewModel(user);

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.about}>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">{bio}</p>
    </ProfileSection>
  );
}
