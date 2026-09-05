import { profileApi } from "@/lib/api";
import type { Profile } from "@/lib/api";
import { parseCommaSeparatedList, parseLineSeparatedList } from "@/utils/forms";

type ProfileFormValues = {
  username: string;
  name: string;
  headline: string;
  bio: string;
  company: string;
  location: string;
  availability: string;
  portfolio: string;
  linksText: string;
  skillsText: string;
  goalsText: string;
  openToWork: boolean;
  isMentor: boolean;
};

export function buildProfileUpdate(
  profile: Profile,
  values: ProfileFormValues,
): Parameters<typeof profileApi.update>[0] {
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
