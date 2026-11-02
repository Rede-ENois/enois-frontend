import type { Profile } from "./profile";

export type UpdateProfileRequest = Partial<
  Pick<
    Profile,
    | "username"
    | "name"
    | "headline"
    | "company"
    | "location"
    | "avatar"
    | "banner"
    | "badge"
    | "bio"
    | "bioHtml"
    | "bannerHtml"
    | "skills"
    | "goals"
    | "availability"
    | "portfolio"
    | "externalLinks"
    | "openToWork"
    | "isMentor"
    | "birthDate"
    | "aka"
    | "resumeUrl"
    | "resumeName"
    | "city"
    | "state"
    | "showCity"
  >
>;
