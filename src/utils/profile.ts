import { profileApi } from "@/lib/api";
import type { Profile } from "@/lib/api";
import type { EditProfileInfoValues } from "@/types/components/profile/edit/edit-profile-info";
import { parseCommaSeparatedList, parseLineSeparatedList } from "@/utils/forms";

export function buildProfileUpdate(
  profile: Profile,
  values: EditProfileInfoValues,
): Parameters<typeof profileApi.updateCurrent>[0] {
  return {
    username: values.username !== profile.username ? values.username : undefined,
    name: values.name !== profile.name ? values.name : undefined,
    headline: values.headline || null,
    bio: values.bio || null,
    company: values.company || null,
    location: values.location || null,
    availability: values.availability || null,
    portfolio: values.portfolio || null,
    externalLinks: parseLineSeparatedList(values.linksText),
    skills: parseCommaSeparatedList(values.skillsText),
    goals: parseCommaSeparatedList(values.goalsText),
    openToWork: values.openToWork,
    isMentor: values.isMentor,
  };
}
