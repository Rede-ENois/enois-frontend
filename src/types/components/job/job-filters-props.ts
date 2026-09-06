import type { JobFilterValues } from "./job-filter-values";

export type JobFiltersProps = {
  values: JobFilterValues;
  onChange: (field: keyof JobFilterValues, value: string) => void;
  onClear: () => void;
};
