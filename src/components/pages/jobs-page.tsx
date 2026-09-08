import { texts } from "@/texts";
import { useJobsPageContext } from "@/utils/components/jobs/use-jobs-page-context";
import { Loader2 } from "lucide-react";

import { AppContainer } from "@/components/app-container";
import { JobCardProvider } from "@/components/job-card-provider";
import { JobsFilters } from "@/components/jobs-filters";
import { JobsInfiniteScroll } from "@/components/jobs-infinite-scroll";

export function Vagas() {
  const { jobs, showLoadingMore, showEmptyState } = useJobsPageContext();

  return (
    <AppContainer>
      <div className="space-y-6">
        <JobsFilters />

        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCardProvider key={job.id} job={job} />
          ))}
        </div>

        {showLoadingMore && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <JobsInfiniteScroll />

        {showEmptyState && (
          <p className="py-12 text-center text-sm text-muted-foreground">{texts.jobs.empty}</p>
        )}
      </div>
    </AppContainer>
  );
}
