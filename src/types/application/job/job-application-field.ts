import type { JobApplicationFieldType } from "./job-application-field-type";

export type JobApplicationField = {
  id: string;
  label: string;
  type: JobApplicationFieldType;
  required: boolean;
};
