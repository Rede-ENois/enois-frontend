import type { Job } from "@/types/application/job/job";

export type JobCardProps = {
  job: Job;
  isApplying: boolean;
  onApply: (jobId: string) => void;
};
