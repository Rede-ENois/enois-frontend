export type JobCandidate = {
  userId: string;
  name: string;
  socialName?: string | null;
  /** The @ of the identity that applied: professional since the interfaces split. */
  username: string;
  /** CORPORATE: applied with the professional identity (link to /profissional/{username}). */
  identity?: "SOCIAL" | "CORPORATE";
  headline: string;
  location: string;
  avatar: string;
  skills: string[];
  experienceYears: number;
  experiencesCount: number;
  reputation: number;
  identityVerified: boolean;
  resumeUrl?: string | null;
  resumeName?: string | null;
};
