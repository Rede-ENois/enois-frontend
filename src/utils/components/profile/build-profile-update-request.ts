import type { Profile } from "@/types/application/profile/profile";
import type { EditProfileValues } from "@/types/components/profile/edit-profile-values";

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const splitCommaSeparated = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function buildProfileUpdateRequest(profile: Profile, values: EditProfileValues) {
  return {
    username: values.username !== profile.username ? values.username : undefined,
    name: values.name !== profile.name ? values.name : undefined,
    headline: values.headline || null,
    bio: values.bio || null,
    company: values.company || null,
    location: values.location || null,
    availability: values.availability || null,
    portfolio: values.portfolio || null,
    externalLinks: values.linksText ? splitLines(values.linksText) : [],
    skills: values.skillsText ? splitCommaSeparated(values.skillsText) : [],
    goals: values.goalsText ? splitCommaSeparated(values.goalsText) : [],
    openToWork: values.openToWork,
    isMentor: values.isMentor,
  };
}
