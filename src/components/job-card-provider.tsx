import type { JobCardProviderProps } from "@/types/components/jobs/job-card-provider-props";
import { JobCardContext } from "@/utils/components/jobs/job-card-context";
import { useJobCardController } from "@/utils/components/jobs/use-job-card-controller";

import { JobCard } from "@/components/job-card";

export function JobCardProvider({ job }: JobCardProviderProps) {
  const view = useJobCardController(job);

  return (
    <JobCardContext.Provider value={{ job, ...view }}>
      <JobCard />
    </JobCardContext.Provider>
  );
}
