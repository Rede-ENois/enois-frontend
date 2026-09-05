import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { jobsApi } from "@/lib/api";
import type { Job } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";
import { mergePage } from "@/utils/collections";

import { AppContainer } from "@/components/app-container";
import { JobsFilters, type JobFilterValues } from "@/components/jobs/jobs-filters";
import { JobsGrid } from "@/components/jobs/jobs-grid";
import { JobsEmpty, JobsInfiniteScroll, JobsLoading } from "@/components/jobs/jobs-pagination";

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
  component: JobsRoute,
});

function JobsRoute() {
  const queryClient = useQueryClient();
  const [filterValues, setFilterValues] = useState<JobFilterValues>(initialFilters);
  const [cursor, setCursor] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  const filters = {
    query: filterValues.query || undefined,
    level: filterValues.level || undefined,
    location: filterValues.location || undefined,
    type: filterValues.type || undefined,
    skills: filterValues.skills || undefined,
  };

  const { data: jobsData, isFetching } = useQuery({
    queryKey: ["jobs", filters, cursor],
    queryFn: () => jobsApi.list({ ...filters, cursor, limit: 10 }),
  });

  const jobs = jobsData?.items ?? [];
  const nextCursor = jobsData?.nextCursor ?? null;
  const filtersKey = JSON.stringify(filters);
  const previousFiltersKey = useRef(filtersKey);

  useEffect(() => {
    if (previousFiltersKey.current === filtersKey) return;
    setAllJobs([]);
    setCursor(null);
    previousFiltersKey.current = filtersKey;
  }, [filtersKey]);

  useEffect(() => {
    setAllJobs((current) => mergePage(current, jobs, cursor === null));
  }, [jobs, cursor]);

  const apply = useMutation({
    mutationFn: (jobId: string) => jobsApi.apply(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const updateFilter = (field: keyof JobFilterValues, value: string) => {
    setFilterValues((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    setFilterValues((current) => ({ ...initialFilters, query: current.query }));
  };

  return (
    <AppContainer>
      <div className="space-y-6">
        <JobsFilters values={filterValues} onChange={updateFilter} onClear={clearFilters} />
        <JobsGrid jobs={allJobs} applying={apply.isPending} onApply={apply.mutate} />
        <JobsLoading visible={isFetching && allJobs.length > 0} />
        <JobsInfiniteScroll
          hasMore={Boolean(nextCursor)}
          loading={isFetching}
          onLoadMore={() => {
            if (nextCursor) setCursor(nextCursor);
          }}
        />
        <JobsEmpty visible={!isFetching && allJobs.length === 0} />
      </div>
    </AppContainer>
  );
}
