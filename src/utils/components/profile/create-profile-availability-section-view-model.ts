import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

export function createProfileAvailabilitySectionViewModel({ user }: ProfileSidebarProps) {
  return {
    availability: user.availability ?? texts.profile.availabilityUnknown,
  };
}
