import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { JobApplication } from "@/types/application/job/job-application";
import { ArrowLeft, BadgeCheck, Loader2, MessageCircle, ShieldAlert } from "lucide-react";

import { jobsApi } from "@/lib/api";
import { actionsFor, statusTone } from "@/lib/job-application-status";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";

import { AppContainer } from "@/components/app-container";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/vagas/$jobId/candidaturas")({
  beforeLoad: requireAuth,
  head: ({ params }) => ({
    meta: buildPageShareTags({
      title: texts.jobs.applications.seoTitle,
      path: `/vagas/${encodeURIComponent(params.jobId)}/candidaturas`,
    }),
  }),
  component: JobApplications,
});

/**
 * Candidaturas recebidas: quem publicou a vaga ve o perfil que o candidato tinha no momento da
 * inscricao (tempo de experiencia, reputacao, verificacao) e as respostas do formulario.
 *
 * A candidatura tambem chega por e-mail e na conversa direta; esta tela e onde o empregador revê
 * tudo sem depender da caixa de entrada.
 */
function JobApplications() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();

  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.get(jobId),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: () => jobsApi.receivedApplications(jobId),
  });

  const applications = data ?? [];

  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(null);

  const changeStatus = useMutation({
    mutationFn: (vars: { applicationId: string; status: JobApplication["status"] }) =>
      jobsApi.updateApplicationStatus(jobId, vars.applicationId, vars.status),
    onMutate: (vars) => {
      setPendingId(vars.applicationId);
      setFeedback(null);
    },
    // A lista so muda depois da resposta do backend: nao ha atualizacao otimista de estado.
    onSuccess: (_updated, vars) => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
      setFeedback({ id: vars.applicationId, ok: true });
    },
    onError: (_error, vars) => setFeedback({ id: vars.applicationId, ok: false }),
    onSettled: () => setPendingId(null),
  });

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link
          to="/vagas/$jobId"
          params={{ jobId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.jobs.applications.backToJob}</>
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {job ? texts.jobs.applications.titleFor(job.title) : texts.jobs.applications.title}
          </h1>

          <p className="mt-1 text-xs text-muted-foreground">
            {texts.jobs.applications.snapshotHint}
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!isLoading && isError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {texts.jobs.applications.error}
          </p>
        )}

        {!isLoading && !isError && applications.length === 0 && (
          <p className="rounded-2xl border border-border-soft px-4 py-8 text-center text-sm text-muted-foreground">
            {texts.jobs.applications.empty}
          </p>
        )}

        <ul className="space-y-4">
          {applications.map((application) => (
            <li key={application.id} className="surface-card space-y-4 p-4 sm:p-5">
              <header className="flex flex-wrap items-start gap-3">
                <UserAvatar
                  src={application.candidate?.avatar || null}
                  alt={application.candidate?.name ?? ""}
                  className="h-12 w-12 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-medium">
                      {application.candidate?.name || texts.jobs.applications.candidate}
                    </span>

                    {application.candidate?.identityVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-growth/15 px-2 py-0.5 text-xs text-growth">
                        <BadgeCheck className="h-3 w-3" />

                        <>{texts.jobs.author.verified}</>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        <ShieldAlert className="h-3 w-3" />

                        <>{texts.jobs.author.notVerified}</>
                      </span>
                    )}

                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs">
                      {texts.jobs.applications.reputation(application.candidate?.reputation ?? 0)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {application.candidate?.headline}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {texts.jobs.applications.experience(
                      application.candidate?.experienceYears ?? 0,
                      application.candidate?.experiencesCount ?? 0,
                    )}
                    {application.candidate?.location ? ` · ${application.candidate.location}` : ""}
                  </p>

                  {(application.candidate?.skills ?? []).length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {texts.jobs.applications.skills}: {application.candidate?.skills.join(", ")}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  {application.candidate?.username && (
                    <Link
                      to="/perfil/$username"
                      params={{ username: application.candidate.username }}
                    >
                      <Button variant="outline" size="sm" className="rounded-full">
                        {texts.jobs.applications.openProfile}
                      </Button>
                    </Link>
                  )}

                  <Button
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => navigate({ to: "/mensagens" })}
                  >
                    <MessageCircle className="h-4 w-4" />

                    <>{texts.jobs.applications.sendMessage}</>
                  </Button>
                </div>
              </header>

              {/* Triagem: estado persistido + so as acoes validas para ele. As regras sao as
                  mesmas que o backend valida — a tela nao oferece transicao que seria recusada. */}
              <div className="flex flex-wrap items-center gap-2 border-t border-border-soft pt-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(application.status)}`}
                >
                  {texts.jobs.applications.statusLabels[application.status]}
                </span>

                {actionsFor(application.status).map((action) => (
                  <Button
                    key={action.status}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={pendingId === application.id}
                    onClick={() =>
                      changeStatus.mutate({ applicationId: application.id, status: action.status })
                    }
                  >
                    {action.label}
                  </Button>
                ))}

                {pendingId === application.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}

                {feedback?.id === application.id && (
                  <span
                    className={`text-xs ${feedback.ok ? "text-growth" : "text-destructive"}`}
                    role="status"
                  >
                    {feedback.ok
                      ? texts.jobs.applications.statusUpdated
                      : texts.jobs.applications.statusError}
                  </span>
                )}
              </div>

              {application.message && (
                <div className="rounded-xl bg-muted/50 px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {texts.jobs.applications.message}
                  </p>

                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">
                    {application.message}
                  </p>
                </div>
              )}

              {application.answers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {texts.jobs.applications.answers}
                  </p>

                  <dl className="space-y-1.5">
                    {application.answers.map((answer) => (
                      <div key={answer.label} className="text-sm">
                        <dt className="font-medium">{answer.label}</dt>

                        <dd className="break-words text-muted-foreground">{answer.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </AppContainer>
  );
}
