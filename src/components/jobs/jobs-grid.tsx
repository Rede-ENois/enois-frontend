import type { Job } from "@/lib/api";

import { JobCard } from "./job-card";

export function JobsGrid({
  jobs,
  applying,
  onApply,
}: {
  jobs: Job[];
  applying: boolean;
  onApply: (jobId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} applying={applying} onApply={onApply} />
      ))}
    </div>
  );
}
