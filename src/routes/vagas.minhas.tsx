import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { Job } from "@/types/application/job/job";
import { ArrowLeft, Briefcase, CheckCircle2, Loader2, Pencil, Trash2, Users } from "lucide-react";

import { ApiError, jobsApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { AppContainer } from "@/components/app-container";
import { JobEditDialog } from "@/components/job-edit-dialog";

export const Route = createFileRoute("/vagas/minhas")({
  beforeLoad: requireAuth,
  head: () => ({ meta: buildPageShareTags({ title: texts.jobs.myJobs, path: "/vagas/minhas" }) }),
  component: MyJobs,
});

function formatPostedAt(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return texts.jobs.today;
  return texts.jobs.daysAgo(days);
}

function MyJobs() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const mine = useQuery({ queryKey: ["jobs", "mine"], queryFn: () => jobsApi.mine(undefined, 20) });
  const applications = useQuery({
    queryKey: ["jobs", "applications"],
    queryFn: () => jobsApi.applications(undefined, 20),
  });

  const removeJob = useMutation({
    mutationFn: (jobId: string) => jobsApi.remove(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setDeleting(null);
    },
  });

  const loading = mine.isLoading || applications.isLoading;
  // Sem isso, uma requisição que falha caía no ramo de lista vazia e a tela afirmava
  // "você ainda não publicou vagas" para quem tem vagas — parecia que a página quebrou.
  const failed = mine.isError || applications.isError;

  // O backend exige identidade verificada para "minhas vagas" (nao para a lista publica). Sem
  // tratar isso, a tela so dizia "nao foi possivel carregar" e a pessoa nao tinha como saber que
  // o caminho e confirmar o e-mail — nem onde fazer isso.
  const needsVerification =
    (mine.error instanceof ApiError && mine.error.code === "EMAIL_NOT_VERIFIED") ||
    (applications.error instanceof ApiError && applications.error.code === "EMAIL_NOT_VERIFIED");

  const retry = () => {
    void mine.refetch();
    void applications.refetch();
  };

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link
          to="/vagas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.jobs.back}</>
        </Link>

        {loading ? (
          <div className="surface-card p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          </div>
        ) : failed ? (
          <div className="surface-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {needsVerification ? texts.jobs.identityRequired : texts.jobs.loadError}
            </p>

            {needsVerification ? (
              <Link to="/seguranca">
                <Button size="sm" className="mt-3 rounded-full">
                  {texts.jobs.identityAction}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={retry}>
                {texts.jobs.retry}
              </Button>
            )}
          </div>
        ) : (
          <>
            <section className="surface-card p-4 sm:p-6">
              <h1 className="text-xl font-semibold tracking-tight">{texts.jobs.myJobs}</h1>

              {(mine.data?.items ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{texts.jobs.myJobsEmpty}</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {(mine.data?.items ?? []).map((job) => (
                    <li key={job.id} className="rounded-xl border border-border-soft p-3">
                      <Link to="/vagas/$jobId" params={{ jobId: job.id }} className="block min-w-0">
                        <p className="truncate text-sm font-medium text-text-strong">
                          {job.title}
                        </p>

                        <p className="mt-0.5 text-xs font-normal text-text-subtle">
                          {job.company}
                          {" · "}
                          {formatPostedAt(job.postedAt)}
                        </p>
                      </Link>

                      {/* Estado do processo seletivo: quem gerencia precisa ver de longe o que
                          ainda esta aberto. */}
                      <span
                        className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          job.status === "CLOSED"
                            ? "bg-muted text-text-subtle"
                            : "bg-primary-soft text-primary"
                        }`}
                      >
                        {job.status === "CLOSED" ? texts.jobs.closed : texts.jobs.open}
                      </span>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="inline-flex items-center gap-1.5 text-xs font-normal text-primary">
                          <Users className="h-3.5 w-3.5" />

                          <>{texts.jobs.applicationsCount(job.applicationsCount ?? 0)}</>
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link to="/vagas/$jobId/candidaturas" params={{ jobId: job.id }}>
                            <Button variant="outline" size="sm" className="rounded-full">
                              {texts.jobs.applications.link}
                            </Button>
                          </Link>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full gap-1.5"
                            onClick={() => setEditing(job)}
                          >
                            <Pencil className="h-3.5 w-3.5" />

                            <>{texts.common.edit}</>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full gap-1.5 text-destructive"
                            onClick={() => setDeleting(job)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />

                            <>{texts.jobs.deleteJob}</>
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="surface-card p-4 sm:p-6">
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight">
                <Briefcase className="h-5 w-5 text-primary" />

                <>{texts.jobs.myApplications}</>
              </h2>

              {(applications.data?.items ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {texts.jobs.myApplicationsEmpty}
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {(applications.data?.items ?? []).map((job) => (
                    <li key={job.id} className="rounded-xl border border-border-soft p-3">
                      <Link to="/vagas/$jobId" params={{ jobId: job.id }} className="block min-w-0">
                        <p className="truncate text-sm font-medium text-text-strong">
                          {job.title}
                        </p>

                        <p className="mt-0.5 text-xs font-normal text-text-subtle">
                          {job.company}
                          {" · "}
                          {formatPostedAt(job.postedAt)}
                        </p>
                      </Link>

                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-normal text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />

                        <>{texts.jobs.applied}</>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      <JobEditDialog job={editing} onOpenChange={(open) => !open && setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={texts.jobs.deleteJob}
        description={texts.jobs.deleteConfirm}
        confirmLabel={texts.jobs.deleteJob}
        destructive
        pending={removeJob.isPending}
        onConfirm={() => deleting && removeJob.mutate(deleting.id)}
      />
    </AppContainer>
  );
}
