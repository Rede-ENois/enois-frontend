import type { Profile } from "@/types/application/profile/profile";

export function createProfileExternalLinksSectionViewModel(user: Profile) {
  return {
    visible: user.externalLinks.length > 0,
    links: user.externalLinks,
  };
}
