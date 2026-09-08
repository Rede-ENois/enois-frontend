import { texts } from "@/texts";
import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";
import { createProfileSkillsSectionViewModel } from "@/utils/components/profile/create-profile-skills-section-view-model";

import { ProfileSection } from "@/components/profile-section";

export function ProfileSkillsSection(props: ProfileHeaderProps) {
  const { visible, skills } = createProfileSkillsSectionViewModel(props);

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.skills}>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-light text-primary"
          >
            {skill}
          </span>
        ))}
      </div>
    </ProfileSection>
  );
}
