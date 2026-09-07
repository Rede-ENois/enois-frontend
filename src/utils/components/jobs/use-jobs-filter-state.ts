import { useState } from "react";

import { JOB_FILTER_INITIAL_VALUES } from "@/constants/job-filter-initial-values";

export function useJobsFilterState() {
  const [filters, setFilters] = useState({ ...JOB_FILTER_INITIAL_VALUES });

  return {
    filters,
    setFilter: (field: keyof typeof JOB_FILTER_INITIAL_VALUES, value: string) => {
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
