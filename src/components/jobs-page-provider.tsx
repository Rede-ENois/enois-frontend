import { JobsPageContext } from "@/utils/components/jobs/jobs-page-context";
import { useJobsPageController } from "@/utils/components/jobs/use-jobs-page-controller";

import { Vagas } from "@/components/pages/jobs-page";

export function JobsPageProvider() {
  const controller = useJobsPageController();

  return (
    <JobsPageContext.Provider value={controller}>
      <Vagas />
    </JobsPageContext.Provider>
  );
}
