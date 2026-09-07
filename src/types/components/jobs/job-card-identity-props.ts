import type { Job } from "@/types/application/job/job";

export type JobCardIdentityProps = {
  job: Job;
  companyInitial: string | undefined;
};
