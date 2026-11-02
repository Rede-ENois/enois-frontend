/** PAGE: a company page; JOBS: internal jobs with no page; EXTERNAL: jobs from other platforms. */
export type CompanyDirectoryItem = {
  kind: "PAGE" | "JOBS" | "EXTERNAL";
  slug: string | null;
  name: string;
  logo: string | null;
  sector: string | null;
  location: string | null;
  openJobs: number;
  openProjects: number;
  followers: number;
};
