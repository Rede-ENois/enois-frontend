import type { Profile } from "@/types/application/profile/profile";

export function createEditProfileValues(profile: Profile) {
  return {
    username: profile.username,
    name: profile.name,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    company: profile.company ?? "",
    location: profile.location ?? "",
    availability: profile.availability ?? "",
    portfolio: profile.portfolio ?? "",
    linksText: (profile.externalLinks ?? []).join("\n"),
    skillsText: (profile.skills ?? []).join(", "),
    goalsText: (profile.goals ?? []).join(", "),
    openToWork: profile.openToWork,
    isMentor: profile.isMentor,
  };
}
