import { useContext } from "react";

import { JobCardContext } from "@/utils/components/jobs/job-card-context";

export function useJobCardContext() {
  const context = useContext(JobCardContext);

  if (!context) {
    throw new Error("Job card components must be rendered inside JobCardProvider");
  }

  return context;
}
