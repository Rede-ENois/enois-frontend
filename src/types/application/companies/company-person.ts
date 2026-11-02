/** The person behind a member, a proposal or a review: the professional identity when active. */
export type CompanyPerson = {
  id: string;
  username: string;
  name: string;
  headline: string | null;
  avatar: string | null;
  identity: "CORPORATE" | "SOCIAL";
  /** `/profissional/{username}` or `/perfil/{username}`. */
  href: string;
};
