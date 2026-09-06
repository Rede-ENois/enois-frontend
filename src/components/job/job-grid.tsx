import type { Job } from "@/types/application/job/job";

import { JobCard } from "./job-card";

type JobGridProps = {
  jobs: Job[];
  isApplying: boolean;
  onApply: (jobId: string) => void;
};

export function JobGrid({ jobs, isApplying, onApply }: JobGridProps) {
  return <div className="grid gap-4 md:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} job={job} isApplying={isApplying} onApply={onApply} />)}</div>;
}
