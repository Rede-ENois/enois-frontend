import type { JobsFilterOption } from "@/types/components/jobs/jobs-filter-option";

export type JobsFilterGroupProps = {
  label: "level" | "location" | "type";
  options: JobsFilterOption[];
};
