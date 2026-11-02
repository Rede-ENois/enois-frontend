import type { CompanyJob } from "./company-job";
import type { CompanyReview } from "./company-review";
import type { MicroProjectView } from "./micro-project-view";

export type CompanyDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sector: string | null;
  size: string | null;
  location: string | null;
  website: string | null;
  logo: string | null;
  cover: string | null;
  myRole: "OWNER" | "ADMIN" | "EDITOR" | "RECRUITER" | null;
  projects: MicroProjectView[];
  jobs: CompanyJob[];
  stats: { openProjects: number; completedProjects: number; openJobs: number; followers: number };
  following: boolean;
  reviews: CompanyReview[];
  /** What the viewer can do on an open microproject. */
  canPropose: "OK" | "SIGN_IN" | "PROFESSIONAL_REQUIRED" | "TEAM";
};
