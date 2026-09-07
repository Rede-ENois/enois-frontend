import type { JobsFiltersProps } from "@/types/components/jobs/jobs-filters-props";

export function createJobsFilterProps(
  filters: Pick<JobsFiltersProps, "query" | "level" | "location" | "type" | "skills">,
  setFilter: (field: "query" | "level" | "location" | "type" | "skills", value: string) => void,
  clear: () => void,
): JobsFiltersProps {
  return {
    ...filters,
    onQueryChange: (value) => setFilter("query", value),
    onLevelChange: (value) => setFilter("level", value),
    onLocationChange: (value) => setFilter("location", value),
    onTypeChange: (value) => setFilter("type", value),
    onSkillsChange: (value) => setFilter("skills", value),
    onClear: clear,
  };
}
