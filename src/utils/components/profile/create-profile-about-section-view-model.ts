import type { Profile } from "@/types/application/profile/profile";

export function createProfileAboutSectionViewModel(user: Profile) {
  return {
    visible: Boolean(user.bio),
    bio: user.bio ?? "",
  };
}
