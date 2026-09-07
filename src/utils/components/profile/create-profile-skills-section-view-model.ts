import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

export function createProfileSkillsSectionViewModel({ user }: ProfileHeaderProps) {
  return {
    visible: user.skills.length > 0,
    skills: user.skills,
  };
}
