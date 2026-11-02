import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { CreateExternalJobInput } from "@/types/application/job/create-external-job-input";
import type { CreateJobInput } from "@/types/application/job/create-job-input";
import type { DeleteJobResult } from "@/types/application/job/delete-job-result";
import type { Job } from "@/types/application/job/job";
import type { JobApplication } from "@/types/application/job/job-application";
import type { JobApplicationInput } from "@/types/application/job/job-application-input";
import type { ListJobsParams } from "@/types/application/job/list-jobs-params";
import type { MyApplication } from "@/types/application/job/my-application";

import { api, buildQuery } from "../api-client";

export const jobsApi = {
  list: (params?: ListJobsParams) =>
    api.get<PageResponse<Job>>(
      `/jobs${buildQuery({ ...params, cursor: params?.cursor ?? undefined, limit: params?.limit ?? 20 })}`,
    ),

  get: (jobId: string) => api.get<Job>(`/jobs/${jobId}`),

  /** Vagas publicadas por mim (o autor ve o total de candidaturas). */
  mine: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Job>>(`/jobs/mine${buildQuery({ cursor, limit })}`),

  /** Vagas em que eu me candidatei. */
  applications: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Job>>(`/jobs/applications${buildQuery({ cursor, limit })}`),

  create: (data: CreateJobInput) => api.post<Job>("/jobs", data),

  update: (jobId: string, data: CreateJobInput) => api.put<Job>(`/jobs/${jobId}`, data),

  remove: (jobId: string) => api.delete<DeleteJobResult>(`/jobs/${jobId}`),

  /** Cadastra uma vaga EXTERNA (achada em outro site): o Énóis lista e o botão vai ao link. */
  submitExternal: (data: CreateExternalJobInput) => api.post<Job>("/jobs/external", data),

  /** As vagas externas que EU cadastrei (com o direito de excluir). */
  myExternal: () => api.get<Job[]>("/jobs/external/mine"),

  /** Exclui uma vaga externa cadastrada por mim. */
  removeExternal: (id: string) => api.delete<void>(`/jobs/external/${id}`),

  /** Encerra o processo seletivo: para de aceitar candidatura e preserva as recebidas. */
  close: (jobId: string) => api.post<Job>(`/jobs/${jobId}/close`),

  /** Candidatura com a mensagem e as respostas dos campos definidos pelo autor. */
  apply: (jobId: string, data?: JobApplicationInput) =>
    api.post<StatusResponse>(`/jobs/${jobId}/applications`, data ?? { answers: [] }),

  /** Triagem: move a candidatura de estado (somente quem publicou a vaga). */
  updateApplicationStatus: (
    jobId: string,
    applicationId: string,
    status: JobApplication["status"],
    feedback?: string,
  ) =>
    api.patch<JobApplication>(`/jobs/${jobId}/applications/${applicationId}`, { status, feedback }),

  /** Minhas candidaturas, com estado e retorno do empregador (GET /jobs/applications/mine). */
  myApplications: () => api.get<MyApplication[]>("/jobs/applications/mine"),

  /** Candidaturas RECEBIDAS numa vaga (somente quem publicou). */
  receivedApplications: (jobId: string, limit = 50) =>
    api.get<JobApplication[]>(`/jobs/${jobId}/applications${buildQuery({ limit })}`),

  /** As vagas salvas (internas e externas resolvidas, na ordem do save). */
  saved: () => api.get<PageResponse<Job>>(`/jobs/saved`),
  /** Os agregadores disponíveis (o filtro da aba externas). */
  platforms: () => api.get<string[]>(`/jobs/platforms`),
  save: (jobId: string) => api.post<StatusResponse>(`/jobs/${jobId}/saves`),

  removeSave: (jobId: string) => api.delete<StatusResponse>(`/jobs/${jobId}/saves`),
};
