import { useContext } from "react";

import { JobsPageContext } from "@/utils/components/jobs/jobs-page-context";

export function useJobsPageContext() {
  const context = useContext(JobsPageContext);

  if (!context) {
    throw new Error("Jobs page components must be rendered inside JobsPageProvider");
  }

  return context;
}
