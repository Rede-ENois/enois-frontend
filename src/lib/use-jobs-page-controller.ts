import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { Job } from "@/types/application/job/job";
import type { ListJobsParams } from "@/types/application/job/list-jobs-params";

import { listJobs } from "@/lib/api/jobs";

const initialFilters = {
  query: "",
  level: "",
  location: "",
  type: "",
  skills: "",
};

export function useJobsPageController() {
  const [filters, setFilters] = useState(initialFilters);
  const [cursor, setCursor] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  const queryFilters: ListJobsParams = {
    query: filters.query || undefined,
    level: filters.level || undefined,
    location: filters.location || undefined,
    type: filters.type || undefined,
    skills: filters.skills || undefined,
  };

  const { data, isFetching } = useQuery({
    queryKey: ["jobs", queryFilters, cursor],
    queryFn: () => listJobs({ ...queryFilters, cursor, limit: 10 }),
  });

  const jobs = data?.items;
  const nextCursor = data?.nextCursor ?? null;

  useEffect(() => {
    if (!jobs || jobs.length === 0) return;
    if (cursor === null) setAllJobs(jobs);
    else setAllJobs((previous) => [...previous, ...jobs]);
  }, [jobs, cursor]);

  const setFilter = (field: keyof typeof initialFilters, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setCursor(null);
    setAllJobs([]);
  };

  const clearFilters = () => {
    setFilters((current) => ({
      ...current,
      level: "",
      location: "",
      type: "",
      skills: "",
    }));
    setCursor(null);
    setAllJobs([]);
  };

  return {
    filters,
    allJobs,
    isFetching,
    nextCursor,
    setFilter,
    clearFilters,
    loadMore: () => {
      if (nextCursor) setCursor(nextCursor);
    },
  };
}
