import type { JobGridProps } from "@/types/components/job/job-grid-props";

import { JobCard } from "./job-card";

export function JobGrid({ jobs, isApplying, onApply }: JobGridProps) {
  return <div className="grid gap-4 md:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} job={job} isApplying={isApplying} onApply={onApply} />)}</div>;
}
