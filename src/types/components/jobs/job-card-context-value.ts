import type { Job } from "@/types/application/job/job";

export type JobCardContextValue = {
  job: Job;
  companyInitial?: string;
  postedAtLabel: string;
  matchLabel: string | null;
  showSalary: boolean;
  apply: () => void;
  applying: boolean;
};
