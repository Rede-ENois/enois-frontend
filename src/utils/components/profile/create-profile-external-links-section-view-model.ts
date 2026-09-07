import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

export function createProfileExternalLinksSectionViewModel({ user }: ProfileSidebarProps) {
  return {
    visible: user.externalLinks.length > 0,
    links: user.externalLinks,
  };
}
