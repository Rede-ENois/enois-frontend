import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft, Globe, MapPin, Users } from "lucide-react";

import { companiesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { getCurrentUser } from "@/lib/current-user";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";
import { CompanyEditDialog } from "@/components/company-edit-dialog";
import { RichText } from "@/components/post/rich-text";

export const Route = createFileRoute("/empresa/$slug")({
  // Pagina PUBLICA: o link circula fora do app.
  head: ({ params }) => ({
    meta: [{ title: texts.empresa.seoTitle(params.slug) }],
  }),
  component: Empresa,
});

function StatusChip({ status }: { status: string }) {
  const label = texts.empresa.status[status] ?? status;
  const tone =
    status === "OPEN"
      ? "bg-green-500/15 text-green-700 dark:text-green-400"
      : status === "IN_PROGRESS"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "bg-muted text-text-subtle";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{label}</span>
  );
}

function Empresa() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUserId = getCurrentUser()?.id ?? null;
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: "",
    problem: "",
    scope: "",
    deliverables: "",
    acceptanceCriteria: "",
    budget: "",
    deadline: "",
  });
  const publish = useMutation({
    mutationFn: () =>
      companiesApi.publishProject(company!.id, {
        title: projectForm.title,
        problem: projectForm.problem,
        scope: projectForm.scope || undefined,
        deliverables: projectForm.deliverables,
        acceptanceCriteria: projectForm.acceptanceCriteria,
        budget: projectForm.budget || undefined,
        deadline: projectForm.deadline || undefined,
      }),
    onSuccess: () => {
      setProjectOpen(false);
      setProjectForm({
        title: "",
        problem: "",
        scope: "",
        deliverables: "",
        acceptanceCriteria: "",
        budget: "",
        deadline: "",
      });
      toast(texts.empresa.published, "success");
      void queryClient.invalidateQueries({ queryKey: ["empresa", slug] });
    },
    onError: () => toast(texts.empresa.projectError, "error"),
  });
  const [proposalFor, setProposalFor] = useState<string | null>(null);
  const [proposalMessage, setProposalMessage] = useState("");
  const [candidaturesFor, setCandidaturesFor] = useState<string | null>(null);
  const [candidatureList, setCandidatureList] = useState<
    { id: string; userId: string; message: string; status: string }[]
  >([]);

  const loadCandidatures = useMutation({
    mutationFn: (projectId: string) => companiesApi.project(projectId),
    onSuccess: (data) => {
      setCandidatureList(data.proposals);
      setCandidaturesFor(data.project.id);
    },
  });

  const select = useMutation({
    mutationFn: (ids: { projectId: string; proposalId: string }) =>
      companiesApi.selectProposal(ids.projectId, ids.proposalId),
    onSuccess: () => {
      toast(texts.empresa.selected, "success");
      void queryClient.invalidateQueries({ queryKey: ["empresa", slug] });
      loadCandidatures.mutate(candidaturesFor!);
    },
  });

  const complete = useMutation({
    mutationFn: (projectId: string) => companiesApi.complete(projectId),
    onSuccess: () => {
      toast(texts.empresa.completed, "success");
      void queryClient.invalidateQueries({ queryKey: ["empresa", slug] });
      setCandidaturesFor(null);
    },
  });

  const { data: company } = useQuery({
    queryKey: ["empresa", slug],
    queryFn: () => companiesApi.bySlug(slug),
  });
  const [editOpen, setEditOpen] = useState(false);

  const propose = useMutation({
    mutationFn: () => companiesApi.propose(proposalFor!, proposalMessage),
    onSuccess: () => {
      setProposalFor(null);
      setProposalMessage("");
      toast(texts.empresa.applySent, "success");
      void queryClient.invalidateQueries({ queryKey: ["empresa", slug] });
    },
    onError: () => toast(texts.empresa.applyError, "error"),
  });

  if (!company) {
    return (
      <AppContainer>
        <div className="mx-auto max-w-2xl p-10 text-sm text-muted-foreground">Carregando...</div>
      </AppContainer>
    );
  }

  const isMember = company.myRole != null;
  const canEdit =
    company.myRole === "OWNER" || company.myRole === "ADMIN" || company.myRole === "EDITOR";
  const canManageTeam = company.myRole === "OWNER" || company.myRole === "ADMIN";

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Link
          to="/empresas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.empresas.title}</>
        </Link>

        <div className="surface-card overflow-hidden">
          <div className="relative">
            {company.cover ? (
              <img
                src={resolveCdnUrl(company.cover)}
                alt=""
                className="h-40 w-full object-cover sm:h-52"
              />
            ) : (
              <div className="h-32 w-full" style={{ background: "var(--gradient-primary)" }} />
            )}
          </div>

          <div className="px-4 pb-5 sm:px-6">
            <div className="-mt-10 flex items-end gap-4">
              {company.logo ? (
                <img
                  src={resolveCdnUrl(company.logo)}
                  alt=""
                  className="h-20 w-20 rounded-2xl border-4 border-surface-card object-cover"
                />
              ) : (
                <span className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-surface-card bg-primary-soft text-2xl font-bold text-primary">
                  {company.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight">
                {company.name}
              </h1>

              {company.myRole && (
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                  {texts.empresa.myRole}: {company.myRole}
                </span>
              )}

              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setEditOpen(true)}
                >
                  {texts.empresa.editPanel.title}
                </Button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {company.sector && <span>{company.sector}</span>}
              {company.size && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {company.size}
                </span>
              )}
              {company.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.location}
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>

            {company.description && (
              <RichText
                content={company.description}
                className="mt-3 whitespace-pre-line text-sm text-text-subtle"
              />
            )}

            {isMember && (
              <div className="mt-4">
                <Button size="sm" className="rounded-full" onClick={() => setProjectOpen(true)}>
                  {texts.empresa.newProject}
                </Button>
              </div>
            )}
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{texts.empresa.jobsTitle}</h2>

          {company.projects.length === 0 ? (
            <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-sm text-muted-foreground">
              {texts.empresa.jobsEmpty}
            </div>
          ) : (
            company.projects.map((project) => (
              <div key={project.id} className="surface-card space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={project.status} />

                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <h3 className="text-base font-semibold">{project.title}</h3>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {project.budget && (
                    <span>
                      <strong className="text-text-strong">{texts.empresa.budget}:</strong>{" "}
                      {project.budget}
                    </span>
                  )}
                  {project.deadline && (
                    <span>
                      <strong className="text-text-strong">{texts.empresa.deadline}:</strong>{" "}
                      {/* O prazo vem como data pura ("2026-10-30"). `new Date` lê isso como
                          meia-noite UTC, que no Brasil ainda é o dia anterior: o prazo aparecia
                          um dia antes. Meio-dia local, como em /freelances, mantém o dia. */}
                      {texts.empresa.deadlineBy(
                        new Date(`${project.deadline}T12:00:00`).toLocaleDateString("pt-BR"),
                      )}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <strong className="text-text-strong">{texts.empresa.problem}:</strong>{" "}
                    {project.problem}
                  </p>

                  {project.scope && (
                    <p className="whitespace-pre-line">
                      <strong className="text-text-strong">{texts.empresa.scope}:</strong>{" "}
                      {project.scope}
                    </p>
                  )}

                  {project.deliverables && (
                    <p className="whitespace-pre-line">
                      <strong className="text-text-strong">{texts.empresa.deliverables}:</strong>{" "}
                      {project.deliverables}
                    </p>
                  )}

                  {project.acceptanceCriteria && (
                    <p className="whitespace-pre-line">
                      <strong className="text-text-strong">{texts.empresa.acceptance}:</strong>{" "}
                      {project.acceptanceCriteria}
                    </p>
                  )}
                </div>

                {project.status === "OPEN" && !isMember && currentUserId && (
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => setProposalFor(project.id)}
                  >
                    {texts.empresa.apply}
                  </Button>
                )}

                {isMember && (
                  <div className="flex flex-wrap gap-2 border-t border-border-soft pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1.5"
                      onClick={() => loadCandidatures.mutate(project.id)}
                    >
                      <Users className="h-3.5 w-3.5" />
                      {texts.empresa.proposals}
                    </Button>

                    {project.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => complete.mutate(project.id)}
                        disabled={complete.isPending}
                      >
                        {texts.empresa.complete}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </div>

      {candidaturesFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-soft bg-surface-card p-5">
            <h3 className="text-base font-semibold">{texts.empresa.proposals}</h3>

            {candidatureList.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{texts.empresa.proposalsEmpty}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {candidatureList.map((item) => (
                  <li key={item.id} className="space-y-2 rounded-xl border border-border-soft p-3">
                    <p className="text-sm">{item.message}</p>

                    <div className="flex items-center gap-2">
                      {item.status === "SENT" ? (
                        <Button
                          size="sm"
                          className="rounded-full"
                          disabled={select.isPending}
                          onClick={() =>
                            select.mutate({ projectId: candidaturesFor!, proposalId: item.id })
                          }
                        >
                          {texts.empresa.selectProposal}
                        </Button>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                          {item.status === "SELECTED"
                            ? texts.empresa.selected
                            : texts.empresa.declined}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => setCandidaturesFor(null)}
              >
                {texts.common.cancel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {projectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border-soft bg-surface-card p-5">
            <h3 className="text-base font-semibold">{texts.empresa.applyTitle}</h3>

            <p className="mt-1 text-xs text-text-subtle">{texts.empresa.applyHint}</p>

            <Textarea
              value={proposalMessage}
              onChange={(event) => setProposalMessage(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={texts.empresa.applyPlaceholder}
              className="mt-3"
            />

            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setProposalFor(null)}>
                {texts.common.cancel}
              </Button>

              <Button
                className="rounded-full"
                disabled={proposalMessage.trim().length < 20 || propose.isPending}
                onClick={() => propose.mutate()}
              >
                {texts.empresa.applyAction}
              </Button>
            </div>
          </div>
        </div>
      )}
      {projectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-soft bg-surface-card p-5">
            <h3 className="text-base font-semibold">{texts.empresa.newProject}</h3>

            <div className="mt-3 space-y-3 text-sm">
              <input
                value={projectForm.title}
                onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })}
                placeholder={texts.empresa.projectTitle}
                className="h-10 w-full rounded-lg border border-border-soft bg-surface-1 px-3 outline-none"
              />

              <label className="block space-y-1">
                <span className="text-xs font-medium">{texts.empresa.problemLabel}</span>

                <Textarea
                  value={projectForm.problem}
                  onChange={(event) =>
                    setProjectForm({ ...projectForm, problem: event.target.value })
                  }
                  rows={3}
                  placeholder={texts.empresa.problemHint}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium">{texts.empresa.scopeLabel}</span>

                <Textarea
                  value={projectForm.scope}
                  onChange={(event) =>
                    setProjectForm({ ...projectForm, scope: event.target.value })
                  }
                  rows={2}
                  placeholder={texts.empresa.scopeHint}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium">{texts.empresa.deliverablesLabel}</span>

                <Textarea
                  value={projectForm.deliverables}
                  onChange={(event) =>
                    setProjectForm({ ...projectForm, deliverables: event.target.value })
                  }
                  rows={2}
                  placeholder={texts.empresa.deliverablesHint}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium">{texts.empresa.acceptanceLabel}</span>

                <Textarea
                  value={projectForm.acceptanceCriteria}
                  onChange={(event) =>
                    setProjectForm({ ...projectForm, acceptanceCriteria: event.target.value })
                  }
                  rows={2}
                  placeholder={texts.empresa.acceptanceHint}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={projectForm.budget}
                  onChange={(event) =>
                    setProjectForm({ ...projectForm, budget: event.target.value })
                  }
                  placeholder={texts.empresa.budgetLabel}
                  className="h-10 w-full rounded-lg border border-border-soft bg-surface-1 px-3 outline-none"
                />
                <input
                  type="date"
                  value={projectForm.deadline}
                  onChange={(event) =>
                    setProjectForm({ ...projectForm, deadline: event.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-border-soft bg-surface-1 px-3 outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => setProjectOpen(false)}
              >
                {texts.common.cancel}
              </Button>

              <Button
                className="rounded-full"
                disabled={
                  publish.isPending ||
                  projectForm.title.trim().length < 8 ||
                  projectForm.problem.trim().length < 30 ||
                  !projectForm.deliverables.trim() ||
                  !projectForm.acceptanceCriteria.trim()
                }
                onClick={() => publish.mutate()}
              >
                {texts.empresa.publish}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* O dialogo de edicao estava importado mas NUNCA montado: o botao "Editar" mudava o
          estado e nada acontecia (em qualquer navegador). */}
      <CompanyEditDialog
        company={company}
        open={editOpen}
        onOpenChange={setEditOpen}
        canManageTeam={canManageTeam}
      />
    </AppContainer>
  );
}
