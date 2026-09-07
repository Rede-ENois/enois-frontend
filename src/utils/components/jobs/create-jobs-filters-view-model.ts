import { JOB_FILTERS } from "@/constants/job-filters";
import { texts } from "@/texts";
import type { JobsFiltersProps } from "@/types/components/jobs/jobs-filters-props";

export function createJobsFiltersViewModel({
  level,
  location,
  type,
  skills,
  onLevelChange,
  onLocationChange,
  onTypeChange,
}: JobsFiltersProps) {
  return {
    hasFilters: Boolean(level || location || type || skills),
    levelOptions: JOB_FILTERS.levels.map((value) => ({
      value,
      label: value.charAt(0) + value.slice(1).toLowerCase(),
      selected: level === value,
      onSelect: () => onLevelChange(level === value ? "" : value),
    })),
    locationOptions: JOB_FILTERS.locations.map((value, index) => ({
      value,
      label: texts.jobs.filters.locations[index],
      selected: location === value,
      onSelect: () => onLocationChange(location === value ? "" : value),
    })),
    typeOptions: JOB_FILTERS.types.map((value) => ({
      value,
      label: value,
      selected: type === value,
      onSelect: () => onTypeChange(type === value ? "" : value),
    })),
  };
}
