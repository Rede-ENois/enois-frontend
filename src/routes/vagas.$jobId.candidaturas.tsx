import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { JobApplication } from "@/types/application/job/job-application";
import type { RecruitmentApplication } from "@/types/application/job/recruitment-application";
import type { RecruitmentBoard as RecruitmentBoardView } from "@/types/application/job/recruitment-board";
import type { ScheduleInterviewInput } from "@/types/application/job/schedule-interview-input";
import type {
  RecruitmentBatchTarget,
  RecruitmentCandidate,
  RecruitmentColumn,
  RecruitmentDetailView,
  RecruitmentStage,
  RecruitmentStatus,
  RecruitmentTableRow,
} from "@rede-enois/design-system/domain";
import {
  ApplicationFeedbackDialog,
  CalendarInterviewDialog,
  JobInterviewActions,
  RecruitmentBoard,
  RecruitmentDetailDialog,
  RecruitmentTable,
} from "@rede-enois/design-system/domain";
import {
  AppLink,
  Button,
  EmptyState,
  LoadingState,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@rede-enois/design-system/ui";

import { jobsApi, recruitmentApi } from "@/lib/api";
import { actionsFor, applicationStatusLabel } from "@/lib/job-application-status";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

function browserZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
}

export const Route = createFileRoute("/vagas/$jobId/candidaturas")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.jobs.applications.seoTitle }] }),
  component: JobApplications,
});

/** Os estados são um contrato fechado do backend; o rótulo é vocabulário de produto da app. */
const STATUS_OPTIONS: { value: RecruitmentStatus; label: string }[] = (
  ["APPLIED", "IN_REVIEW", "ADVANCED", "NOT_SELECTED"] as const
).map((value) => ({ value, label: texts.jobs.applications.statusLabels[value] }));

/** O score da candidatura em qualquer coluna do board (o `rejected` só tem as que saíram). */
function scoreOf(board: RecruitmentBoardView | undefined, applicationId: string) {
  if (!board) return null;
  for (const column of board.columns) {
    const card = column.cards.find((item) => item.applicationId === applicationId);
    if (card) return card.score;
  }
  return board.rejected.find((item) => item.applicationId === applicationId)?.score ?? null;
}

/**
 * Candidaturas recebidas: o funil completo da vaga, desenhado pelo design system (kanban por
 * etapa, tabela paginada por cursor e a ficha da candidatura). A app só orquestra — buscas,
 * mutações e o mapeamento da API nos view models do DS. A autorização é toda do backend.
 */
function JobApplications() {
  const { jobId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.get(jobId),
  });

  const boardQuery = useQuery({
    queryKey: ["recruitment-board", jobId],
    queryFn: () => recruitmentApi.board(jobId),
  });

  // A tabela pagina por cursor; a página corrente vive em estado para o "carregar mais" anexar.
  const [tab, setTab] = useState("board");
  const [cursor, setCursor] = useState<string | null>(null);
  const [rows, setRows] = useState<RecruitmentApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<RecruitmentStatus | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [resultNote, setResultNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string[] | null>(null);
  const [interviewFor, setInterviewFor] = useState<JobApplication | null>(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const timeZoneId = browserZone();

  const pageQuery = useQuery({
    queryKey: ["recruitment-page", jobId, statusFilter, search],
    queryFn: () =>
      recruitmentApi.page(jobId, { status: statusFilter, search: search || null, limit: 30 }),
    enabled: tab === "table",
  });

  // O retrato vem da candidatura clássica: a ficha mostra o perfil do momento da inscrição.
  const applicationsQuery = useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: () => jobsApi.receivedApplications(jobId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["recruitment-board", jobId] });
    queryClient.invalidateQueries({ queryKey: ["recruitment-page", jobId] });
    queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
  };

  const applicationOf = (applicationId: string) =>
    (applicationsQuery.data ?? []).find((application) => application.id === applicationId) ?? null;

  const candidateOf = (userId: string): RecruitmentCandidate | null => {
    const application = (applicationsQuery.data ?? []).find(
      (item) => item.candidate?.userId === userId,
    );
    if (!application?.candidate) return null;
    const candidate = application.candidate;
    return {
      applicationId: application.id,
      userId: candidate.userId,
      name: candidate.name || texts.jobs.applications.candidate,
      avatarUrl: candidate.avatar || null,
      headline: candidate.headline || null,
      status: application.status,
      statusLabel: applicationStatusLabel(application.status),
      appliedAt: application.appliedAt,
      stageId:
        boardQuery.data?.columns.find((column) =>
          column.cards.some((card) => card.applicationId === application.id),
        )?.stageId ?? null,
      rejected: application.status === "NOT_SELECTED",
      score: scoreOf(boardQuery.data, application.id),
    };
  };

  // A ficha é um retrato, mas é barata de recomputar por render: uma busca na lista carregada.
  const detail: RecruitmentDetailView | null = (() => {
    if (!openId) return null;
    const application = applicationOf(openId);
    const candidate = application?.candidate ?? null;
    if (!application || !candidate) return null;
    return {
      applicationId: application.id,
      name: candidate.name || texts.jobs.applications.candidate,
      avatarUrl: candidate.avatar || null,
      headline: candidate.headline || null,
      identityVerified: candidate.identityVerified,
      reputation: candidate.reputation,
      experienceYears: candidate.experienceYears,
      experiencesCount: candidate.experiencesCount,
      location: candidate.location || null,
      skills: candidate.skills,
      message: application.message,
      answers: application.answers.map((answer) => ({ label: answer.label, value: answer.value })),
      statusLabel: applicationStatusLabel(application.status),
      score: scoreOf(boardQuery.data, application.id),
    };
  })();

  const openApplication = openId ? applicationOf(openId) : null;

  const batchMove = useMutation({
    // REJECT só sai depois do motivo: o diálogo coleta o texto e a mutação de lote é chamada lá.
    mutationFn: (target: RecruitmentBatchTarget) =>
      target.kind === "REJECT"
        ? Promise.resolve([])
        : recruitmentApi.batchMove(jobId, selectedIds, target.stageId, target.kind),
    onMutate: () => {
      setError(null);
      setResultNote(null);
      setPending(true);
    },
    onSuccess: (outcomes) => {
      const moved = outcomes.filter((outcome) => outcome.movement !== null).length;
      const refused = outcomes.filter((outcome) => outcome.errorCode !== null);
      const lines = [
        moved === 1 ? "1 candidatura movida." : `${moved} candidaturas movidas.`,
        ...refused.slice(0, 3).map((outcome) => outcome.errorMessage ?? outcome.errorCode ?? ""),
      ].filter(Boolean);
      setResultNote(lines.join(" "));
      setSelectedIds([]);
      refresh();
    },
    onError: () => setError(texts.jobs.applications.error),
    onSettled: () => setPending(false),
  });

  const changeStatus = useMutation({
    mutationFn: (vars: { applicationId: string; status: JobApplication["status"] }) =>
      jobsApi.updateApplicationStatus(jobId, vars.applicationId, vars.status),
    onMutate: () => {
      setError(null);
      setResultNote(null);
      setPending(true);
    },
    onSuccess: () => refresh(),
    onError: () => setError(texts.jobs.applications.statusError),
    onSettled: () => setPending(false),
  });

  const saveInterview = useMutation({
    mutationFn: (vars: { application: JobApplication; values: ScheduleInterviewInput }) => {
      const existing = vars.application.interview;
      return existing
        ? jobsApi.rescheduleInterview(jobId, vars.application.id, existing.id, vars.values)
        : jobsApi.scheduleInterview(jobId, vars.application.id, vars.values);
    },
    onMutate: () => setInterviewError(null),
    onSuccess: () => {
      refresh();
      setInterviewFor(null);
    },
    onError: () => setInterviewError(texts.jobs.applications.interview.error),
  });

  const cancelInterview = useMutation({
    mutationFn: (application: JobApplication) =>
      jobsApi.cancelInterview(jobId, application.id, application.interview?.id ?? ""),
    onMutate: () => setInterviewError(null),
    onSuccess: () => {
      refresh();
      setInterviewFor(null);
    },
    onError: () => setInterviewError(texts.jobs.applications.interview.cancelError),
  });

  const stages: RecruitmentStage[] = boardQuery.data?.stages ?? [];
  const columns: RecruitmentColumn[] = (boardQuery.data?.columns ?? []).map((column) => ({
    stageId: column.stageId,
    cards: column.cards
      .map((card) => candidateOf(card.userId))
      .filter((candidate): candidate is RecruitmentCandidate => candidate !== null),
  }));

  const tableRows: RecruitmentTableRow[] = (pageQuery.data?.items ?? []).map((item) => {
    const candidate = candidateOf(item.userId);
    const stage = stages.find((candidateStage) => candidateStage.id === item.stageId);
    return {
      applicationId: item.applicationId,
      userId: item.userId,
      name: candidate?.name ?? texts.jobs.applications.candidate,
      avatarUrl: candidate?.avatarUrl ?? null,
      headline: candidate?.headline ?? null,
      status: item.status,
      statusLabel: applicationStatusLabel(item.status),
      appliedAt: item.appliedAt,
      stageId: item.stageId,
      stageName: stage?.name ?? null,
      rejected: item.rejected,
      score: item.score,
    };
  });

  const summary = boardQuery.data?.summary ?? { total: 0, inProcess: 0, rejected: 0 };

  return (
    <AppContainer>
      <AppLink href={`/vagas/${jobId}`}>
        <Button variant="link" size="sm">
          {texts.jobs.applications.backToJob}
        </Button>
      </AppLink>

      <PageHeader
        title={job ? texts.jobs.applications.titleFor(job.title) : texts.jobs.applications.title}
        description={texts.jobs.applications.snapshotHint}
      />

      {boardQuery.isPending ? (
        <LoadingState />
      ) : boardQuery.isError ? (
        <EmptyState title={texts.jobs.applications.error}>
          <Button variant="outline" size="sm" onClick={() => boardQuery.refetch()}>
            {texts.jobs.retry}
          </Button>
        </EmptyState>
      ) : summary.total === 0 ? (
        <EmptyState title={texts.jobs.applications.empty} />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="board">{texts.jobs.applications.title}</TabsTrigger>

            <TabsTrigger value="table">{texts.jobs.applications.link}</TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <RecruitmentBoard
              stages={stages}
              columns={columns}
              rejected={(boardQuery.data?.rejected ?? [])
                .map((item) => candidateOf(item.userId))
                .filter((candidate): candidate is RecruitmentCandidate => candidate !== null)}
              summary={summary}
              selectedIds={selectedIds}
              onToggleSelected={(applicationId) =>
                setSelectedIds((current) =>
                  current.includes(applicationId)
                    ? current.filter((id) => id !== applicationId)
                    : [...current, applicationId],
                )
              }
              onOpen={setOpenId}
              onBatchMove={(target) =>
                target.kind === "REJECT"
                  ? setRejectTarget([...selectedIds])
                  : batchMove.mutate(target)
              }
              pending={pending}
              error={error}
              resultNote={resultNote}
            />
          </TabsContent>

          <TabsContent value="table">
            <RecruitmentTable
              rows={tableRows}
              stages={stages}
              statusOptions={STATUS_OPTIONS}
              statusFilter={statusFilter}
              onStatusFilter={(status) => {
                setStatusFilter(status);
                setCursor(null);
                setRows([]);
              }}
              search={search}
              onSearch={setSearch}
              selectedIds={selectedIds}
              onToggleSelected={(applicationId) =>
                setSelectedIds((current) =>
                  current.includes(applicationId)
                    ? current.filter((id) => id !== applicationId)
                    : [...current, applicationId],
                )
              }
              onTogglePage={(selectAll) =>
                setSelectedIds(selectAll ? tableRows.map((row) => row.applicationId) : [])
              }
              onOpen={setOpenId}
              onBatchMove={(target) =>
                target.kind === "REJECT"
                  ? setRejectTarget([...selectedIds])
                  : batchMove.mutate(target)
              }
              hasMore={Boolean(pageQuery.data?.nextCursor)}
              loadingMore={pageQuery.isFetching}
              onLoadMore={() => {
                const next = pageQuery.data?.nextCursor;
                if (next) setCursor(next);
              }}
              loading={pageQuery.isPending}
              pending={pending}
              error={pageQuery.isError ? texts.jobs.applications.error : error}
              resultNote={resultNote}
            />
          </TabsContent>
        </Tabs>
      )}

      <RecruitmentDetailDialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        detail={detail}
      >
        {openApplication && (
          <>
            {actionsFor(openApplication.status).map((action) => (
              <Button
                key={action.status}
                variant={action.status === "NOT_SELECTED" ? "destructive" : "outline"}
                size="sm"
                disabled={pending}
                onClick={() => {
                  if (action.status === "NOT_SELECTED") {
                    setRejectTarget([openApplication.id]);
                    return;
                  }
                  changeStatus.mutate({ applicationId: openApplication.id, status: action.status });
                }}
              >
                {action.label}
              </Button>
            ))}

            {openApplication.status !== "NOT_SELECTED" && (
              <JobInterviewActions
                interview={openApplication.interview ?? null}
                separated
                onSchedule={() => setInterviewFor(openApplication)}
                onReschedule={() => setInterviewFor(openApplication)}
                onCancel={() => cancelInterview.mutate(openApplication)}
                error={interviewError}
              />
            )}
          </>
        )}
      </RecruitmentDetailDialog>

      <ApplicationFeedbackDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        pending={pending}
        onSubmit={(feedback) => {
          const targets = rejectTarget ?? [];
          setRejectTarget(null);
          setPending(true);
          const request =
            targets.length === 1
              ? jobsApi
                  .updateApplicationStatus(jobId, targets[0], "NOT_SELECTED", feedback)
                  .then(() => [])
              : recruitmentApi.batchMove(jobId, targets, null, "REJECT", feedback);
          request
            .then((outcomes) => {
              const moved = outcomes.filter((outcome) => outcome.movement !== null).length;
              if (outcomes.length > 0) {
                setResultNote(
                  moved === 1 ? "1 candidatura movida." : `${moved} candidaturas movidas.`,
                );
                setSelectedIds([]);
              }
              refresh();
            })
            .catch(() => setError(texts.jobs.applications.error))
            .finally(() => setPending(false));
        }}
      />
      <CalendarInterviewDialog
        open={interviewFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setInterviewFor(null);
            setInterviewError(null);
          }
        }}
        interview={interviewFor?.interview ?? null}
        timeZoneId={timeZoneId}
        candidateName={interviewFor?.candidate?.name ?? null}
        savePending={saveInterview.isPending}
        saveError={interviewError}
        onSave={(values) => {
          if (!interviewFor) return;
          saveInterview.mutate({
            application: interviewFor,
            values: {
              startsAt: values.startsAt,
              endsAt: values.endsAt,
              timeZoneId: values.timeZoneId,
              notes: values.notes,
            },
          });
        }}
      />
    </AppContainer>
  );
}
