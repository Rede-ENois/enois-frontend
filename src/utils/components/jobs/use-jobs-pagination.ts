import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { Job } from "@/types/application/job/job";
import type { ListJobsParams } from "@/types/application/job/list-jobs-params";

import { listJobs } from "@/lib/api/jobs";

export function useJobsPagination(filters: ListJobsParams) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const { data, isFetching } = useQuery({
    queryKey: ["jobs", filters, cursor],
    queryFn: () => listJobs({ ...filters, cursor, limit: 10 }),
  });
  const pageItems = data?.items;
  const nextCursor = data?.nextCursor ?? null;

  useEffect(() => {
    if (!pageItems || pageItems.length === 0) return;
    if (cursor === null) setJobs(pageItems);
    else setJobs((previous) => [...previous, ...pageItems]);
  }, [cursor, pageItems]);

  return {
    jobs,
    isFetching,
    hasMore: Boolean(nextCursor),
    loadMore: () => {
      if (nextCursor) setCursor(nextCursor);
    },
    reset: () => {
      setCursor(null);
      setJobs([]);
    },
  };
}
