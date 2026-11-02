import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CompanyDetail } from "@/types/application/companies/company-detail";
import type { CompanyPerson } from "@/types/application/companies/company-person";
import type { MicroProjectView } from "@/types/application/companies/micro-project-view";
import {
  CompanyPageView,
  type CompanyPersonView,
  CompleteMicroProjectDialog,
  type MicroProjectCardData,
  MicroProjectProposalDialog,
  MicroProjectProposalsDialog,
  NewMicroProjectDialog,
} from "@rede-enois/design-system/domain";
import { Button, LoadingState, useToast } from "@rede-enois/design-system/ui";
import { ArrowLeft, Flag } from "lucide-react";

import { companiesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { dataCurta } from "@/lib/date/format";
import { companyQueries } from "@/lib/query-options/companies";
import { useProfessionalIdentity } from "@/lib/use-professional-identity";

import { AppContainer } from "@/components/app-container";
import { CompanyEditDialog } from "@/components/company-edit-dialog";
import { MicroProjectManagement } from "@/components/micro-project-management";
import { ReportDialog } from "@/components/post/report-dialog";
import { RichText } from "@/components/post/rich-text";

export const Route = createFileRoute("/empresa/$slug")({
  // Pagina PUBLICA: o link circula fora do app.
  head: ({ params }) => ({
    meta: [{ title: texts.empresa.seoTitle(params.slug) }],
  }),
  component: Empresa,
});

const lines = (text: string | null) =>
  (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function toPerson(person: CompanyPerson): CompanyPersonView {
  return {
    name: person.name,
    username: person.username,
    headline: person.headline,
    avatar: person.avatar ? (resolveCdnUrl(person.avatar) ?? null) : null,
    href: person.href,
  };
}

function toCard(project: MicroProjectView): MicroProjectCardData {
  return {
    id: project.id,
    title: project.title,
    problem: project.problem,
    scope: project.scope,
    deliverables: lines(project.deliverables),
    acceptance: lines(project.acceptanceCriteria),
    budget: project.budget,
    deadlineLabel: project.deadline ? dataCurta(project.deadline) : null,
    publishedLabel: dataCurta(project.createdAt),
    status: project.status,
    myProposal: project.myProposal,
    proposalCount: project.proposalCount,
  };
}

/** What the team still has to do for a page people trust; each step opens where it is done. */
function checklist(company: CompanyDetail, onEdit: () => void, onNewProject: () => void) {
  const steps = texts.empresa.checklist;
  return [
    { key: "logo", label: steps.logo, done: Boolean(company.logo), onAction: onEdit },
    { key: "cover", label: steps.cover, done: Boolean(company.cover), onAction: onEdit },
    { key: "about", label: steps.about, done: Boolean(company.description), onAction: onEdit },
    { key: "website", label: steps.website, done: Boolean(company.website), onAction: onEdit },
    {
      key: "project",
      label: steps.project,
      done: company.projects.length > 0,
      onAction: onNewProject,
    },
  ];
}

function Empresa() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { applicant } = useProfessionalIdentity();
  const detailKey = companyQueries.detail(slug).queryKey;
  const { data: company, isPending, isError } = useQuery(companyQueries.detail(slug));

  const [editOpen, setEditOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [proposalFor, setProposalFor] = useState<MicroProjectView | null>(null);
  const [proposalsFor, setProposalsFor] = useState<MicroProjectView | null>(null);
  const [completeFor, setCompleteFor] = useState<MicroProjectView | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: detailKey });

  // The project with its proposals (team only): the list dialog and the "who delivered" of the
  // completion both read it.
  const managedProject = proposalsFor ?? completeFor;
  const projectDetail = useQuery({
    queryKey: ["microprojeto", managedProject?.id],
    queryFn: () => companiesApi.project(managedProject!.id),
    enabled: Boolean(managedProject),
  });

  const follow = useMutation({
    mutationFn: (following: boolean) =>
      following ? companiesApi.unfollow(company!.id) : companiesApi.follow(company!.id),
    onSuccess: (state) =>
      queryClient.setQueryData<CompanyDetail>(detailKey, (current) =>
        current
          ? {
              ...current,
              following: state.following,
              stats: { ...current.stats, followers: state.followers },
            }
          : current,
      ),
    onError: () => toast(texts.empresa.followError, "error"),
  });

  const publish = useMutation({
    mutationFn: companiesApi.publishProject.bind(null, company?.id ?? ""),
    onSuccess: () => {
      setNewProjectOpen(false);
      toast(texts.empresa.published, "success");
      void refresh();
    },
  });

  const propose = useMutation({
    mutationFn: (message: string) => companiesApi.propose(proposalFor!.id, message),
    onSuccess: () => {
      setProposalFor(null);
      toast(texts.empresa.applySent, "success");
      void refresh();
    },
  });

  const select = useMutation({
    mutationFn: (proposalId: string) => companiesApi.selectProposal(proposalsFor!.id, proposalId),
    onSuccess: () => {
      toast(texts.empresa.selected, "success");
      void projectDetail.refetch();
      void refresh();
    },
    onError: () => toast(texts.empresa.selectError, "error"),
  });

  const complete = useMutation({
    mutationFn: (review: { rating?: number; text?: string }) =>
      companiesApi.complete(completeFor!.id, review),
    onSuccess: () => {
      setCompleteFor(null);
      toast(texts.empresa.completed, "success");
      void refresh();
    },
  });

  if (isPending) {
    return (
      <AppContainer>
        <LoadingState />
      </AppContainer>
    );
  }

  if (isError || !company) {
    return (
      <AppContainer>
        <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{texts.empresa.notFound}</p>

          <Link
            to="/empresas"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />

            <>{texts.empresas.title}</>
          </Link>
        </div>
      </AppContainer>
    );
  }

  const role = company.myRole;
  const canEdit = role === "OWNER" || role === "ADMIN" || role === "EDITOR";
  const projectById = (id: string) => company.projects.find((project) => project.id === id) ?? null;
  const count = (status: MicroProjectView["status"]) =>
    company.projects.filter((project) => project.status === status).length;
  const delivered = projectDetail.data?.proposals.find((item) => item.status === "SELECTED");

  // Denunciar: só quem tem sessão e NÃO é da equipe (a página não denuncia a si mesma). O anônimo
  // é mandado ao login pelos próprios cards; denúncia exige conta.
  const canReport = !role && company.canPropose !== "SIGN_IN";

  return (
    <AppContainer>
      {canReport && (
        <div className="mb-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-1.5 text-text-subtle"
            onClick={() => setReportOpen(true)}
          >
            <Flag className="h-4 w-4" aria-hidden />

            <>{texts.empresa.report}</>
          </Button>
        </div>
      )}

      <CompanyPageView
        company={{
          name: company.name,
          logo: company.logo ? (resolveCdnUrl(company.logo) ?? null) : null,
          cover: company.cover ? (resolveCdnUrl(company.cover) ?? null) : null,
          sector: company.sector,
          sizeLabel: company.size
            ? (texts.empresa.sizeOptions[company.size] ?? company.size)
            : null,
          location: company.location,
          website: company.website,
          description: company.description ? (
            <RichText content={company.description} className="whitespace-pre-line" />
          ) : null,
        }}
        stats={company.stats}
        roleLabel={role ? texts.empresa.roles[role] : null}
        backHref="/empresas"
        onEdit={canEdit ? () => setEditOpen(true) : undefined}
        // Visitors are invited to sign in by the cards; the team does not follow its own page.
        follow={
          company.canPropose === "SIGN_IN" || role
            ? null
            : {
                following: company.following,
                pending: follow.isPending,
                onToggle: () => follow.mutate(company.following),
              }
        }
        team={
          canEdit
            ? {
                checklist: checklist(
                  company,
                  () => setEditOpen(true),
                  () => setNewProjectOpen(true),
                ),
                counts: {
                  open: count("OPEN"),
                  newProposals: company.projects
                    .filter((project) => project.status === "OPEN")
                    .reduce((total, project) => total + (project.proposalCount ?? 0), 0),
                  inProgress: count("IN_PROGRESS"),
                  completed: count("COMPLETED"),
                },
                onNewProject: () => setNewProjectOpen(true),
              }
            : null
        }
        jobs={company.jobs.map((job) => ({
          id: job.id,
          title: job.title,
          meta: [job.location, job.type, job.level].filter(Boolean).join(" · "),
          href: `/vagas/${job.id}`,
        }))}
        jobsHref={
          company.stats.openJobs > company.jobs.length
            ? `/vagas?query=${encodeURIComponent(company.name)}`
            : null
        }
        projects={company.projects.map(toCard)}
        viewer={company.canPropose}
        projectActions={{
          onPropose: (id) => setProposalFor(projectById(id)),
          onShowProposals: (id) => setProposalsFor(projectById(id)),
          onComplete: (id) => setCompleteFor(projectById(id)),
          signInHref: "/entrar",
          professionalSetupHref: "/profissional",
          busyId: complete.isPending ? (completeFor?.id ?? null) : null,
        }}
        reviews={company.reviews.map((review) => ({
          projectTitle: review.projectTitle,
          rating: review.rating,
          text: review.text,
          dateLabel: dataCurta(review.createdAt),
          person: toPerson(review.person),
        }))}
      />
      {canEdit && <MicroProjectManagement company={company} />}

      <MicroProjectProposalDialog
        open={proposalFor != null}
        onOpenChange={(open) => {
          if (!open) {
            setProposalFor(null);
            propose.reset();
          }
        }}
        projectTitle={proposalFor?.title ?? ""}
        applicant={applicant ?? { name: "", username: "" }}
        pending={propose.isPending}
        error={propose.isError ? texts.empresa.applyError : null}
        onSubmit={(message) => propose.mutate(message)}
      />
      <MicroProjectProposalsDialog
        open={proposalsFor != null}
        onOpenChange={(open) => {
          if (!open) setProposalsFor(null);
        }}
        projectTitle={proposalsFor?.title ?? ""}
        projectStatus={projectDetail.data?.project.status ?? proposalsFor?.status ?? "OPEN"}
        loading={projectDetail.isPending}
        error={projectDetail.isError}
        onRetry={() => void projectDetail.refetch()}
        proposals={(projectDetail.data?.proposals ?? []).map((item) => ({
          id: item.id,
          person: item.person
            ? toPerson(item.person)
            : { name: texts.empresa.someone, username: "", avatar: null, href: "#" },
          message: item.message,
          status: item.status,
          sentLabel: dataCurta(item.proposedAt),
          conversationHref: item.conversationId
            ? `/mensagens?conversation=${item.conversationId}`
            : null,
        }))}
        selectingId={select.isPending ? (select.variables ?? null) : null}
        onSelect={(id) => select.mutate(id)}
      />
      <CompleteMicroProjectDialog
        open={completeFor != null}
        onOpenChange={(open) => {
          if (!open) {
            setCompleteFor(null);
            complete.reset();
          }
        }}
        personName={delivered?.person?.name ?? texts.empresa.someone}
        pending={complete.isPending}
        error={complete.isError ? texts.empresa.completeError : null}
        onConfirm={(review) => complete.mutate(review)}
      />
      <NewMicroProjectDialog
        open={newProjectOpen}
        onOpenChange={(open) => {
          setNewProjectOpen(open);
          if (!open) publish.reset();
        }}
        pending={publish.isPending}
        error={publish.isError ? texts.empresa.projectError : null}
        onSubmit={(values) =>
          publish.mutate({
            title: values.title,
            problem: values.problem,
            scope: values.scope ?? undefined,
            deliverables: values.deliverables.join("\n"),
            acceptanceCriteria: values.acceptance.join("\n"),
            budget: values.budget ?? undefined,
            deadline: values.deadline ?? undefined,
          })
        }
      />
      <ReportDialog
        targetId={company.id}
        targetType="COMPANY"
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
      <CompanyEditDialog
        company={company}
        open={editOpen}
        onOpenChange={setEditOpen}
        canManageTeam={role === "OWNER" || role === "ADMIN"}
      />
    </AppContainer>
  );
}
