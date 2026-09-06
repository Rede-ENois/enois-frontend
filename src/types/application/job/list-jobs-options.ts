export type ListJobsOptions = {
  query?: string;
  type?: string;
  level?: string;
  location?: string;
  skills?: string;
  cursor?: string | null;
  limit?: number;
};
