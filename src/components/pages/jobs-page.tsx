import { texts } from "@/texts";
import { Loader2 } from "lucide-react";

import { useJobsPageController } from "@/utils/components/jobs/use-jobs-page-controller";

import { AppContainer } from "@/components/app-container";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { JobCard } from "@/components/job-card";
import { JobsFilters } from "@/components/jobs-filters";

export function Vagas() {
  const { jobs, filtersProps, infiniteScrollProps, showLoadingMore, showEmptyState } =
    useJobsPageController();

  return (
    <AppContainer>
      <div className="space-y-6">
        <JobsFilters {...filtersProps} />

        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {showLoadingMore && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <InfiniteScroll {...infiniteScrollProps} />

        {showEmptyState && (
          <p className="py-12 text-center text-sm text-muted-foreground">{texts.jobs.empty}</p>
        )}
      </div>
    </AppContainer>
  );
}
