import { Loader2 } from "lucide-react";

import { useJobsPageController } from "@/lib/use-jobs-page-controller";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { JobCard } from "@/components/job-card";
import { JobsFilters } from "@/components/jobs-filters";

export function Vagas() {
  const {
    filters,
    allJobs,
    isFetching,
    nextCursor,
    setFilter,
    clearFilters,
    loadMore,
  } = useJobsPageController();

  return (
    <AppContainer>
      <div className="space-y-6">
        <JobsFilters
          query={filters.query}
          level={filters.level}
          location={filters.location}
          type={filters.type}
          skills={filters.skills}
          onQueryChange={(value) => setFilter("query", value)}
          onLevelChange={(value) => setFilter("level", value)}
          onLocationChange={(value) => setFilter("location", value)}
          onTypeChange={(value) => setFilter("type", value)}
          onSkillsChange={(value) => setFilter("skills", value)}
          onClear={clearFilters}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {allJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {isFetching && allJobs.length > 0 && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <InfiniteScroll hasMore={!!nextCursor} loading={isFetching} onLoadMore={loadMore} />

        {!isFetching && allJobs.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">{texts.jobs.empty}</p>
        )}
      </div>
    </AppContainer>
  );
}
