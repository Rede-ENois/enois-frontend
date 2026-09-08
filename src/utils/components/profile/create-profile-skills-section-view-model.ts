import type { Profile } from "@/types/application/profile/profile";

export function createProfileSkillsSectionViewModel(user: Profile) {
  return {
    visible: user.skills.length > 0,
    skills: user.skills,
  };
}
