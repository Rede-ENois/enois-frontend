import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";

export function createProfileAvailabilitySectionViewModel(user: Profile) {
  return {
    availability: user.availability ?? texts.profile.availabilityUnknown,
  };
}
