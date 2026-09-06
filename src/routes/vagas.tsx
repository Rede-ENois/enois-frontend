import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { jobApi } from "@/lib/api";
import type { Job } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";
import type { JobFilterValues } from "@/types/components/job/job-filter-values";
import { mergePage } from "@/utils/collections";

import { AppContainer } from "@/components/app-container";
import { JobEmptyState } from "@/components/job/job-empty-state";
import { JobFilters } from "@/components/job/job-filters";
import { JobGrid } from "@/components/job/job-grid";
import { JobInfiniteScroll } from "@/components/job/job-infinite-scroll";
import { JobLoading } from "@/components/job/job-loading";

const initialFilters: JobFilterValues = {
  query: "",
  level: "",
  location: "",
  type: "",
  skills: "",
};

export const Route = createFileRoute("/vagas")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.jobs.seoTitle }] }),
  component: JobsPage,
});

function JobsPage() {
  const queryClient = useQueryClient();
  const [filterValues, setFilterValues] = useState<JobFilterValues>(initialFilters);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadedJobs, setLoadedJobs] = useState<Job[]>([]);

  const filters = {
    query: filterValues.query || undefined,
    level: filterValues.level || undefined,
    location: filterValues.location || undefined,
    type: filterValues.type || undefined,
    skills: filterValues.skills || undefined,
  };

  const { data: jobsData, isFetching } = useQuery({
    queryKey: ["jobs", filters, cursor],
    queryFn: () => jobApi.list({ ...filters, cursor, limit: 10 }),
  });

  const jobs = jobsData?.items ?? [];
  const nextCursor = jobsData?.nextCursor ?? null;
  const filtersKey = JSON.stringify(filters);
  const previousFiltersKey = useRef(filtersKey);

  useEffect(() => {
    if (previousFiltersKey.current === filtersKey) return;
    setLoadedJobs([]);
    setCursor(null);
    previousFiltersKey.current = filtersKey;
  }, [filtersKey]);

  useEffect(() => {
    setLoadedJobs((currentJobs) => mergePage(currentJobs, jobs, cursor === null));
  }, [jobs, cursor]);

  const applyToJobMutation = useMutation({
    mutationFn: (jobId: string) => jobApi.apply(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const handleFilterChange = (field: keyof JobFilterValues, value: string) => {
    setFilterValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilterValues((currentValues) => ({ ...initialFilters, query: currentValues.query }));
  };

  return (
    <AppContainer>
      <div className="space-y-6">
        <JobFilters
          values={filterValues}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
        <JobGrid
          jobs={loadedJobs}
          isApplying={applyToJobMutation.isPending}
          onApply={applyToJobMutation.mutate}
        />
        <JobLoading isVisible={isFetching && loadedJobs.length > 0} />
        <JobInfiniteScroll
          hasMore={Boolean(nextCursor)}
          isLoading={isFetching}
          onLoadMore={() => {
            if (nextCursor) setCursor(nextCursor);
          }}
        />
        <JobEmptyState isVisible={!isFetching && loadedJobs.length === 0} />
      </div>
    </AppContainer>
  );
}
