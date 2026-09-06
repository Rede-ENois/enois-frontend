export type Profile = {
  id: string;
  username: string;
  name: string;
  headline: string | null;
  email: string;
  company: string | null;
  location: string | null;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  skills: string[];
  goals: string[];
  availability: string | null;
  portfolio: string | null;
  externalLinks: string[];
  openToWork: boolean;
  isMentor: boolean;
  connectionsCount?: number;
  followersCount?: number;
  reputation?: number;
};

export type UpdateProfileInput = Partial<
  Pick<
    Profile,
    | "username"
    | "name"
    | "headline"
    | "company"
    | "location"
    | "avatar"
    | "banner"
    | "bio"
    | "skills"
    | "goals"
    | "availability"
    | "portfolio"
    | "externalLinks"
    | "openToWork"
    | "isMentor"
  >
>;
