import { texts } from "@/texts";
import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

import { createProfileAboutSectionViewModel } from "@/utils/components/profile/create-profile-about-section-view-model";

import { ProfileSection } from "@/components/profile-section";

export function ProfileAboutSection(props: ProfileHeaderProps) {
  const { visible, bio } = createProfileAboutSectionViewModel(props);

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.about}>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">{bio}</p>
    </ProfileSection>
  );
}
