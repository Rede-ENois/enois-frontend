import type { ListJobsOptions } from "@/types/application/job/list-jobs-options";

export type JobFilterValues = Required<
  Pick<ListJobsOptions, "query" | "level" | "location" | "type" | "skills">
>;
