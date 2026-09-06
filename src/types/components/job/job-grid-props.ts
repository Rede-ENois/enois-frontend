import type { Job } from "@/types/application/job/job";

export type JobGridProps = {
  jobs: Job[];
  isApplying: boolean;
  onApply: (jobId: string) => void;
};
