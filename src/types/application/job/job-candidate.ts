export type JobCandidate = {
  userId: string;
  name: string;
  socialName?: string | null;
  username: string;
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
