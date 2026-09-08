import { useState } from "react";

import { JOB_FILTER_INITIAL_VALUES } from "@/constants/job-filter-initial-values";
import type { JobsFilterValues } from "@/types/components/jobs/jobs-filter-values";

export function useJobsFilterState() {
  const [filters, setFilters] = useState<JobsFilterValues>({ ...JOB_FILTER_INITIAL_VALUES });

  return {
    filters,
    setFilter: (field: keyof JobsFilterValues, value: string) => {
      setFilters((current) => ({ ...current, [field]: value }));
    },
    clearNonQueryFilters: () => {
      setFilters((current) => ({
        ...current,
        level: "",
        location: "",
        type: "",
        skills: "",
      }));
    },
  };
}
