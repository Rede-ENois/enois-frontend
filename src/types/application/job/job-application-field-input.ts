import type { JobApplicationFieldType } from "./job-application-field-type";

export type JobApplicationFieldInput = {
  label: string;
  type: JobApplicationFieldType;
  required: boolean;
};
