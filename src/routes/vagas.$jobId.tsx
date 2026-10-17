import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { JobApplication } from "@/types/application/job/job-application";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Briefcase,
  CheckCircle2,
  CircleSlash,
  Loader2,
  MapPin,
  Pencil,
  ShieldAlert,
  Trash2,
  Users,
  ExternalLink,
} from "lucide-react";

import { jobsApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { buildPageShareTags } from "@/lib/open-graph";
import { formatSalary } from "@/lib/currency";
import { useCurrentUser } from "@/lib/current-user";
import { actionsFor, applicationStatusLabel, statusTone } from "@/lib/job-application-status";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { AppContainer } from "@/components/app-container";
import { ApplyJobDialog } from "@/components/apply-job-dialog";
import { JobEditDialog } from "@/components/job-edit-dialog";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/vagas/$jobId")({
  loader: async ({ params }) => {
    try {
      return await jobsApi.get(params.jobId);
    } catch {
      return null;
    }
  },
  head: ({ loaderData: job, params }) => {
    const title = job ? `${job.title}${job.company ? ` · ${job.company}` : ""} · ${texts.brand.name}` : texts.jobs.seoTitle;
    return {
      meta: buildPageShareTags({
        title,
        description: job?.description || (job ? `${job.company ? `Vaga em ${job.company}.` : "Oportunidade profissional."} Confira os detalhes no Énóis.` : "Confira oportunidades no Énóis."),
        path: `/vagas/${encodeURIComponent(params.jobId)}`,
        imageUrl: resolveCdnUrl(job?.logo),
        imageAlt: job ? `Vaga ${job.title}${job.company ? ` em ${job.company}` : ""}` : title,
      }),
    };
  },
  component: JobDetail,
});

function formatPostedAt(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return texts.jobs.today;
  return texts.jobs.daysAgo(days);
}

function JobDetail() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: job,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.get(jobId),
  });

  /**
   * Dono da vaga. O backend tambem manda `owner`, mas o `viewerId` de la engole qualquer falha de
   * sessao e devolve null — com isso o autor via a vaga como se fosse de outra pessoa e perdia
   * editar/excluir. O id do autor e a fonte confiavel aqui: se bate com o usuario logado, e dele.
   */
  // `useCurrentUser` e HOOK: busca /me e re-renderiza quando a resposta chega. A versao anterior
  // lia o id direto do cache, e como esta pagina nunca pedia /me o valor vinha nulo — o DONO via a
  // vaga como se fosse de outra pessoa: so "se inscrever" e "denunciar".
  const { data: me } = useCurrentUser();
  const isOwner = Boolean(job?.owner) || (!!job?.author?.id && job.author.id === (me?.id ?? null));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };

  const apply = useMutation({ mutationFn: () => jobsApi.apply(jobId), onSuccess: invalidate });
  const toggleSave = useMutation({
    mutationFn: (saved: boolean) => (saved ? jobsApi.removeSave(jobId) : jobsApi.save(jobId)),
    onSuccess: invalidate,
  });
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [closeOpen, setCloseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Candidaturas recebidas: o dono da vaga da o feedback daqui mesmo, sem trocar de tela.
  const { data: receivedData } = useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: () => jobsApi.receivedApplications(jobId, 50),
    enabled: isOwner,
  });
  const received = receivedData ?? [];

  const changeStatus = useMutation({
    mutationFn: (vars: { applicationId: string; status: JobApplication["status"] }) =>
      jobsApi.updateApplicationStatus(jobId, vars.applicationId, vars.status),
    onMutate: (vars) => setPendingId(vars.applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] }),
    onSettled: () => setPendingId(null),
  });

  const close = useMutation({
    mutationFn: () => jobsApi.close(jobId),
    onSuccess: () => {
      invalidate();
      setCloseOpen(false);
    },
  });

  const remove = useMutation({
    mutationFn: () => jobsApi.remove(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate({ to: "/vagas" });
    },
  });

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <Link
          to="/vagas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.jobs.back}</>
        </Link>

        {isLoading ? (
          <div className="surface-card p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          </div>
        ) : isError || !job ? (
          <div className="surface-card p-8 text-center">
            <p className="text-sm text-muted-foreground">{texts.jobs.notFound}</p>
          </div>
        ) : (
          <div className="surface-card p-4 sm:p-6">
            <header className="flex items-start gap-3 border-b border-border-soft pb-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">{job.title}</h1>

                <p className="mt-0.5 text-sm text-text-subtle">
                  {job.company}
                  {job.location ? (
                    <>
                      {" · "}
                      <MapPin className="mb-0.5 inline h-3.5 w-3.5" />
                      {job.location}
                    </>
                  ) : null}
                </p>

                <p className="mt-1 text-xs font-normal text-text-date">
                  {job.postedAt && formatPostedAt(job.postedAt)}
                </p>
              </div>
            </header>

            {job.author && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border-soft bg-surface-2 p-3">
                <UserAvatar
                  src={job.author.avatar}
                  alt={job.author.name}
                  className="h-10 w-10 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-normal text-text-subtle">
                    {texts.jobs.author.label}
                  </p>

                  {job.author.username ? (
                    <Link
                      to="/perfil/$username"
                      params={{ username: job.author.username }}
                      className="truncate text-sm font-medium text-text-strong hover:underline"
                    >
                      {job.author.name}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-medium">{job.author.name}</span>
                  )}

                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-accent px-2 py-0.5">
                      {texts.jobs.author.reputation(job.author.reputation)}
                    </span>

                    {job.author.identityVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-growth/15 px-2 py-0.5 text-growth">
                        <BadgeCheck className="h-3 w-3" />

                        <>{texts.jobs.author.verified}</>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                        <ShieldAlert className="h-3 w-3" />

                        <>{texts.jobs.author.notVerified}</>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border-soft px-2.5 py-1">{job.type}</span>

              <span className="rounded-full border border-border-soft px-2.5 py-1">
                {job.level}
              </span>

              {formatSalary(job.salary, job.currency) && (
                <span className="rounded-full border border-border-soft px-2.5 py-1">
                  {formatSalary(job.salary, job.currency)}
                </span>
              )}
            </div>

            {isOwner && (
              <div className="mt-4 rounded-xl bg-surface-2 p-3">
                <p className="text-sm font-medium text-text-strong">{texts.jobs.ownerBadge}</p>

                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-normal text-text-subtle">
                  <Users className="h-3.5 w-3.5" />

                  <>{texts.jobs.applicationsCount(job.applicationsCount ?? 0)}</>
                </p>
              </div>
            )}

            <section className="mt-5">
              <h2 className="text-base font-normal text-text-strong">{texts.jobs.about}</h2>

              <p className="mt-2 whitespace-pre-line break-words text-sm font-normal leading-relaxed text-text-subtle">
                {job.description?.trim() || texts.jobs.description}
              </p>
            </section>

            <section className="mt-5">
              <h2 className="text-base font-normal text-text-strong">{texts.jobs.skills}</h2>

              {job.skills?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border-soft bg-transparent px-2.5 py-1 text-xs font-normal text-text-subtle"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm font-normal text-text-subtle">
                  {texts.jobs.noSkills}
                </p>
              )}
            </section>

            {isOwner && (
              <section className="mt-5">
                <h2 className="text-base font-normal text-text-strong">
                  {texts.jobs.applications.title}
                </h2>

                {received.length === 0 ? (
                  <p className="mt-2 text-sm font-normal text-text-subtle">
                    {texts.jobs.applications.empty}
                  </p>
                ) : (
                  <ul className="mt-2 space-y-3">
                    {received.map((application) => (
                      <li key={application.id} className="rounded-xl border border-border-soft p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <UserAvatar
                            src={application.candidate?.avatar || null}
                            alt={application.candidate?.name ?? ""}
                            className="h-9 w-9 shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text-strong">
                              {application.candidate?.name || texts.jobs.applications.candidate}
                            </p>

                            <p className="text-xs font-normal text-text-subtle">
                              {texts.jobs.applications.reputation(
                                application.candidate?.reputation ?? 0,
                              )}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(
                              application.status,
                            )}`}
                          >
                            {applicationStatusLabel(application.status)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {actionsFor(application.status).map((action) => (
                            <Button
                              key={action.status}
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              disabled={pendingId === application.id}
                              onClick={() =>
                                changeStatus.mutate({
                                  applicationId: application.id,
                                  status: action.status,
                                })
                              }
                            >
                              {action.label}
                            </Button>
                          ))}

                          {pendingId === application.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <Link to="/vagas/$jobId/candidaturas" params={{ jobId }}>
                  <Button variant="outline" size="sm" className="mt-3 rounded-full">
                    {texts.jobs.applications.link}
                  </Button>
                </Link>
              </section>
            )}

            <footer className="mt-6 flex flex-wrap items-center gap-2 border-t border-border-soft pt-4">
              {isOwner ? (
                <>
                  <Link to="/vagas/$jobId/candidaturas" params={{ jobId }}>
                    <Button variant="outline" className="rounded-full gap-2">
                      <Users className="h-4 w-4" />

                      <>{texts.jobs.applications.link}</>
                    </Button>
                  </Link>

                  {/* Editar fica AQUI tambem: quem abre a propria vaga e o lugar mais obvio
                      para procurar, e antes so existia em "Minhas vagas". */}
                  <Button
                    variant="outline"
                    className="rounded-full gap-2"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />

                    <>{texts.jobs.editJob}</>
                  </Button>

                  {job.status === "OPEN" && (
                    <Button
                      variant="outline"
                      className="rounded-full gap-2"
                      disabled={close.isPending}
                      onClick={() => setCloseOpen(true)}
                    >
                      <CircleSlash className="h-4 w-4" />

                      <>{texts.jobs.closeJob}</>
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    className="rounded-full gap-2"
                    disabled={remove.isPending}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />

                    <>{texts.jobs.deleteJob}</>
                  </Button>
                </>
              ) : job.applied ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />

                  <>{texts.jobs.applied}</>
                </span>
              ) : job.status === "CLOSED" ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-text-subtle">
                  <CircleSlash className="h-4 w-4" />

                  <>{texts.jobs.closed}</>
                </span>
              ) : job.sourceType === "EXTERNAL" ? (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-text-subtle">
                    <ExternalLink className="h-3.5 w-3.5" />

                    <>{texts.jobs.externalBadge(job.sourcePlatform ?? "plataforma externa")}</>
                  </span>

                  <p className="text-xs font-normal text-text-subtle">
                    {texts.jobs.externalNotice(job.sourcePlatform ?? "plataforma de origem")}
                  </p>

                  {job.sourceUrl && (
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      <ExternalLink className="h-4 w-4" />

                      <>{texts.jobs.visit}</>
                    </a>
                  )}
                </div>
              ) : (
                <ApplyJobDialog job={job}>
                  <Button className="rounded-full">{texts.jobs.apply}</Button>
                </ApplyJobDialog>
              )}

              {!isOwner && job.sourceType !== "EXTERNAL" && (
                <Button
                  variant="outline"
                  className="rounded-full gap-2"
                  disabled={toggleSave.isPending}
                  onClick={() => toggleSave.mutate(Boolean(job.saved))}
                >
                  <Bookmark className={job.saved ? "h-4 w-4 text-primary" : "h-4 w-4"} />

                  <>{job.saved ? texts.jobs.saved : texts.jobs.save}</>
                </Button>
              )}
            </footer>

            {job.status === "CLOSED" && (
              <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs font-normal text-text-subtle">
                {texts.jobs.closedHint}
              </p>
            )}

            {job.applied && !isOwner && (
              <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs font-normal text-text-subtle">
                {texts.jobs.appliedHint}
              </p>
            )}

            {(apply.isError || toggleSave.isError || remove.isError || close.isError) && (
              <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {texts.errors.unexpected}
              </p>
            )}
          </div>
        )}
      </div>

      <JobEditDialog job={editOpen ? (job ?? null) : null} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={texts.jobs.deleteJob}
        description={texts.jobs.deleteConfirm}
        confirmLabel={texts.jobs.deleteJob}
        destructive
        pending={remove.isPending}
        onConfirm={() => job && remove.mutate()}
      />
      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={texts.jobs.closeJob}
        description={texts.jobs.closeConfirm}
        confirmLabel={texts.jobs.closeJob}
        pending={close.isPending}
        onConfirm={() => close.mutate()}
      />
    </AppContainer>
  );
}
