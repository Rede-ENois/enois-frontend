import { api, buildQuery } from "../api-client";

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string | null;
  location: string;
  type: string;
  level: string;
  salary: string | null;
  skills: string[];
  postedAt: string;
  matchScore: number | null;
}

export interface ListJobsOptions {
  query?: string;
  type?: string;
  level?: string;
  location?: string;
  skills?: string;
  cursor?: string | null;
  limit?: number;
}

export interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export const jobApi = {
  list: (options?: ListJobsOptions) =>
    api.get<PageResponse<Job>>(
      `/jobs${buildQuery({
        ...options,
        cursor: options?.cursor ?? undefined,
        limit: options?.limit ?? 20,
      })}`,
    ),

  getById: (jobId: string) => api.get<Job>(`/jobs/${jobId}`),

  apply: (jobId: string) => api.post<{ status: string }>(`/jobs/${jobId}/applications`),

  save: (jobId: string) => api.post<{ status: string }>(`/jobs/${jobId}/saves`),

  unsave: (jobId: string) => api.delete<{ status: string }>(`/jobs/${jobId}/saves`),
};
