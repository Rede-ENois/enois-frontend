import type { Job } from "@/types/application/job/job";

export type JobCardMetaProps = {
  job: Job;
  matchLabel: string | null;
  showSalary: boolean;
};
