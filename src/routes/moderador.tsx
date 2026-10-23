import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ModeratorApplicationView } from "@/types/application/moderation/moderator-application-view";
import type { ModeratorMeView } from "@/types/application/moderation/moderator-me-view";
import type { SanctionProposalDecision } from "@/types/application/moderation/sanction-proposal-decision";
import type { SanctionProposalView } from "@/types/application/moderation/sanction-proposal-view";
import type { ModeratorTabId } from "@/types/routes/moderador/moderator-tab-id";
import {
  ArrowLeft,
  Bug,
  Check,
  Flag,
  FolderKanban,
  Gamepad2,
  Gavel,
  History,
  LifeBuoy,
  Mail,
  Scale,
  ScanEye,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

import { moderationApi } from "@/lib/api";
import { reportsAdminApi } from "@/lib/api/reports-admin";
import { requireAuth } from "@/lib/require-auth";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";
import { AppealsSection } from "@/components/moderation/appeals-section";
import { DisputesSection } from "@/components/moderation/disputes-section";
import { EmailLogSection } from "@/components/moderation/email-log-section";
import { GamesReviewSection } from "@/components/moderation/games-review-section";
import { PanicModeSection } from "@/components/moderation/panic-mode-section";
import { ProjectsReviewSection } from "@/components/moderation/projects-review-section";
import { SupportTicketsSection } from "@/components/moderation/support-tickets-section";
import { SuspiciousPostsSection } from "@/components/moderation/suspicious-posts-section";
import { SuspiciousUsersSection } from "@/components/moderation/suspicious-users-section";
import { UserPicker } from "@/components/user-picker";

export const Route = createFileRoute("/moderador")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.moderator.seoTitle }] }),
  component: Moderador,
});

const ALL_TABS: { id: ModeratorTabId; label: string; icon: typeof Flag; adminOnly: boolean }[] = [
  { id: "reports", label: texts.moderator.tabs.reports, icon: Flag, adminOnly: false },
  { id: "games", label: texts.moderator.tabs.games, icon: Gamepad2, adminOnly: false },
  { id: "projects", label: texts.moderator.tabs.projects, icon: FolderKanban, adminOnly: false },
  { id: "support", label: texts.moderator.tabs.support, icon: LifeBuoy, adminOnly: true },
  { id: "issues", label: texts.moderator.tabs.issues, icon: Bug, adminOnly: true },
  { id: "history", label: texts.moderator.tabs.history, icon: History, adminOnly: true },
  { id: "appeals", label: texts.moderator.tabs.appeals, icon: ShieldAlert, adminOnly: true },
  { id: "disputes", label: texts.moderator.tabs.disputes, icon: Scale, adminOnly: true },
  {
    id: "applications",
    label: texts.moderator.tabs.applications,
    icon: UserCheck,
    adminOnly: true,
  },
  { id: "users", label: texts.moderator.tabs.users, icon: Gavel, adminOnly: false },
  // Triagem de contas em série é trabalho do time inteiro (decisão da dona): qualquer moderador
  // aprovado vê a fila e pode banir em lote.
  {
    id: "suspicious",
    label: texts.moderator.tabs.suspicious,
    icon: ScanEye,
    adminOnly: false,
  },
  // Posts denunciados com score alto: exclusão em lote pelo time inteiro, como as contas.
  {
    id: "suspiciousPosts",
    label: texts.moderator.tabs.suspiciousPosts,
    icon: Trash2,
    adminOnly: false,
  },
  { id: "emails", label: texts.moderator.tabs.emails, icon: Mail, adminOnly: true },
];

/**
 * Painel de moderador.
 *
 * - Sem papel: mostra a credibilidade e, se elegível (>= 200), o formulário de candidatura.
 * - Moderador aprovado: denúncias e fila de jogos.
 * - Admin: todas as filas, candidaturas, punição direta e log de e-mails.
 *
 * Quem decide o papel é o backend; esta tela só reflete `/moderation/me`.
 */
function Moderador() {
  const [tab, setTab] = useState<ModeratorTabId>("reports");

  const {
    data: me,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["moderator", "me"],
    queryFn: () => moderationApi.me(),
    retry: false,
  });

  if (isLoading) {
    return (
      <AppContainer>
        <div className="mx-auto w-full max-w-3xl">
          <LoadingState />
        </div>
      </AppContainer>
    );
  }

  if (error || !me) {
    return (
      <AppContainer>
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border-soft bg-surface-card p-6 text-sm text-text-subtle">
          {texts.moderator.error}
        </div>
      </AppContainer>
    );
  }

  const canModerate = me.moderator || me.admin;
  const visibleTabs = ALL_TABS.filter((item) => me.admin || !item.adminOnly);
  const activeTab = visibleTabs.some((item) => item.id === tab) ? tab : "reports";

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.moderator.back}</>
        </Link>

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{texts.moderator.title}</h1>

            {me.admin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />

                <>{texts.moderator.adminBadge}</>
              </span>
            )}

            {!me.admin && me.moderator && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-text">
                <Shield className="h-3.5 w-3.5" />

                <>{texts.moderator.moderatorBadge}</>
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{texts.moderator.description}</p>
        </header>

        {me.admin && <PanicModeSection />}

        {canModerate ? (
          <div className="space-y-4">
            <div className="flex gap-1 overflow-x-auto pb-1" role="tablist">
              {visibleTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border-soft text-text-subtle hover:border-primary/50 hover:text-primary",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />

                  <>{item.label}</>
                </button>
              ))}
            </div>

            {activeTab === "reports" && <ReportsSection admin={me.admin} />}
            {activeTab === "games" && <GamesReviewSection />}
            {activeTab === "projects" && <ProjectsReviewSection />}
            {me.admin && activeTab === "support" && <SupportTicketsSection mode="active" />}
            {me.admin && activeTab === "issues" && (
              <SupportTicketsSection lockedCategory="BUG" mode="active" />
            )}
            {me.admin && activeTab === "history" && <SupportTicketsSection mode="history" />}
            {me.admin && activeTab === "appeals" && <AppealsSection />}
            {me.admin && activeTab === "disputes" && <DisputesSection />}
            {me.admin && activeTab === "applications" && <ApplicationsSection />}
            {activeTab === "users" && <SanctionSection me={me} />}
            {canModerate && activeTab === "suspicious" && <SuspiciousUsersSection />}
            {canModerate && activeTab === "suspiciousPosts" && <SuspiciousPostsSection />}
            {me.admin && activeTab === "emails" && <EmailLogSection />}
          </div>
        ) : (
          <ApplicationSection me={me} />
        )}
      </div>
    </AppContainer>
  );
}

function ApplicationSection({ me }: { me: ModeratorMeView }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");

  const apply = useMutation({
    mutationFn: () =>
      moderationApi.apply({
        motivation: motivation.trim(),
        experience: experience.trim() || undefined,
        availability: availability.trim() || undefined,
      }),
    onSuccess: () => {
      toast(texts.moderator.eligibility.sent, "success");
      setMotivation("");
      setExperience("");
      setAvailability("");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "me"] });
    },
    onError: () => toast(texts.moderator.eligibility.error, "error"),
  });

  const application = me.application;
  const pending = application?.status === "PENDING";
  const rejected = application?.status === "REJECTED";
  const revoked = application?.status === "REVOKED";
  const showForm = me.eligible && !pending && !me.moderator;

  return (
    <section className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
      <h2 className="text-base font-medium">{texts.moderator.eligibility.title}</h2>

      <p className="text-sm text-muted-foreground">
        {texts.moderator.eligibility.description(me.minReputation)}
      </p>

      <p className="text-sm font-medium text-text-strong">
        {texts.moderator.eligibility.reputation(me.reputation, me.minReputation)}
      </p>

      {!me.eligible && (
        <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-text-subtle">
          {texts.moderator.eligibility.low(me.minReputation)}
        </p>
      )}

      {pending && (
        <div className="rounded-xl border border-primary/30 bg-primary-soft px-4 py-3">
          <p className="text-sm font-medium text-primary-text">
            {texts.moderator.eligibility.pendingTitle}
          </p>

          <p className="mt-1 text-sm text-text-subtle">{texts.moderator.eligibility.pendingBody}</p>

          {application.reviewNote && (
            <p className="mt-2 text-xs text-text-subtle">{application.reviewNote}</p>
          )}
        </div>
      )}

      {(rejected || revoked) && (
        <div className="rounded-xl border border-border-soft bg-surface-2 px-4 py-3">
          <p className="text-sm font-medium text-text-strong">
            {rejected
              ? texts.moderator.eligibility.rejectedTitle
              : texts.moderator.eligibility.revokedTitle}
          </p>

          {application?.reviewNote && (
            <p className="mt-1 text-sm text-text-subtle">{application.reviewNote}</p>
          )}
        </div>
      )}

      {showForm && (
        <form
          className="space-y-3 pt-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (motivation.trim().length < 20) return;
            apply.mutate();
          }}
        >
          <label className="block space-y-1">
            <span className="text-sm font-medium text-text-strong">
              {texts.moderator.eligibility.motivation}
            </span>

            <Textarea
              value={motivation}
              onChange={(event) => setMotivation(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={texts.moderator.eligibility.motivationPlaceholder}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-text-strong">
              {texts.moderator.eligibility.experience}
            </span>

            <Textarea
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder={texts.moderator.eligibility.experiencePlaceholder}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-text-strong">
              {texts.moderator.eligibility.availability}
            </span>

            <Input
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              maxLength={500}
              placeholder={texts.moderator.eligibility.availabilityPlaceholder}
            />
          </label>

          <Button
            type="submit"
            className="rounded-full"
            disabled={apply.isPending || motivation.trim().length < 20}
          >
            {apply.isPending ? texts.common.sending : texts.moderator.eligibility.apply}
          </Button>
        </form>
      )}
    </section>
  );
}

/** Cor do badge por severidade do motivo. */
function reasonStyle(reason: string): string {
  switch (reason) {
    case "VIOLENCE":
    case "HARASSMENT":
      return "bg-destructive/15 text-destructive";
    case "SCAM":
    case "SPAM":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400";
    case "DISCRIMINATION":
    case "PREJUDICE":
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
    default:
      return "bg-surface-2 text-text-strong";
  }
}

function ReportsSection({ admin }: { admin: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filterReason, setFilterReason] = useState<string | null>(null);
  const [filterTarget, setFilterTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "reports"],
    queryFn: () => moderationApi.reports(),
    retry: false,
  });

  const vote = useMutation({
    mutationFn: ({ reportId, vote }: { reportId: string; vote: "PUNISH" | "DISMISS" }) =>
      moderationApi.vote(reportId, vote),
    onSuccess: (result) => {
      toast(result.message, "success");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "reports"] });
    },
    onError: () => toast(texts.moderator.reports.voteError, "error"),
  });

  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const adminAction = useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: "remove" | "warn" }) =>
      action === "remove"
        ? reportsAdminApi.deletePost(reportId, "Removido pelo painel de moderador")
        : reportsAdminApi.warn(reportId),
    onSuccess: (_result, variables) => {
      toast(
        variables.action === "remove"
          ? texts.moderator.reports.removeDone
          : texts.moderator.reports.warnDone,
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["moderator", "reports"] });
    },
    onError: () => toast(texts.moderator.reports.actionError, "error"),
  });

  const filtered = (data ?? []).filter((r) => {
    if (filterReason && r.reason !== filterReason) return false;
    if (filterTarget && r.targetType !== filterTarget) return false;
    return true;
  });

  const activeReasons = [...new Set((data ?? []).map((r) => r.reason))];
  const activeTargets = [...new Set((data ?? []).map((r) => r.targetType))];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
        {texts.moderator.reports.title}
      </h2>

      {isLoading ? (
        <LoadingState />
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-surface-card">
          <EmptyState icon={Gavel} title={texts.moderator.reports.empty} />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setFilterReason(null);
                setFilterTarget(null);
              }}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition",
                !filterReason && !filterTarget
                  ? "bg-primary text-primary-foreground"
                  : "border border-border-soft text-text-subtle hover:border-primary/50",
              )}
            >
              {texts.moderator.reports.filterAll}
            </button>

            {activeReasons.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => {
                  setFilterReason(filterReason === reason ? null : reason);
                  setFilterTarget(null);
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition",
                  filterReason === reason
                    ? "bg-primary text-primary-foreground"
                    : "border border-border-soft text-text-subtle hover:border-primary/50",
                )}
              >
                {texts.moderator.reports.reasons[reason] ?? reason}
              </button>
            ))}

            {activeTargets.length > 1 &&
              activeTargets.map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => {
                    setFilterTarget(filterTarget === target ? null : target);
                    setFilterReason(null);
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition",
                    filterTarget === target
                      ? "bg-primary text-primary-foreground"
                      : "border border-border-soft text-text-subtle hover:border-primary/50",
                  )}
                >
                  {texts.moderator.reports.targets[target] ?? target}
                </button>
              ))}
          </div>

          <ul className="space-y-3">
            {filtered.map((report) => {
              const alreadyVoted = report.myVote !== null;
              return (
                <li
                  key={report.reportId}
                  className={cn(
                    "space-y-3 rounded-2xl border bg-surface-card p-4 transition",
                    alreadyVoted ? "border-primary/20" : "border-border-soft",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-subtle">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-semibold",
                        reasonStyle(report.reason),
                      )}
                    >
                      {texts.moderator.reports.reasons[report.reason] ?? report.reason}
                    </span>

                    <span className="rounded-full border border-border-soft px-2 py-0.5">
                      {texts.moderator.reports.targets[report.targetType] ?? report.targetType}
                    </span>

                    <span>{new Date(report.createdAt).toLocaleString("pt-BR")}</span>
                  </div>

                  <div className="grid gap-1 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-text-subtle">{texts.moderator.reports.reporter}: </span>

                      <span className="font-medium text-text-strong">{report.reporter}</span>
                    </p>

                    <p>
                      <span className="text-text-subtle">{texts.moderator.reports.author}: </span>

                      <span className="font-medium text-text-strong">
                        {report.author || texts.moderator.reports.noAuthor}
                      </span>
                    </p>
                  </div>

                  {report.content ? (
                    <div className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border-soft bg-surface-2 px-3 py-2 text-sm text-text-strong">
                      {report.content}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm italic text-text-subtle">
                      {texts.moderator.reports.noContent}
                    </p>
                  )}

                  {report.description && (
                    <p className="rounded-lg border-l-2 border-primary/30 pl-3 text-xs text-text-subtle">
                      "{report.description}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5",
                          report.punishVotes > 0
                            ? "bg-destructive/10 text-destructive"
                            : "text-text-subtle",
                        )}
                      >
                        Punir: {report.punishVotes}
                      </span>

                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5",
                          report.dismissVotes > 0
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "text-text-subtle",
                        )}
                      >
                        Descartar: {report.dismissVotes}
                      </span>

                      <span className="text-text-subtle">Quórum: {report.quorum}</span>

                      {report.myVote && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                          {texts.moderator.reports.myVote(report.myVote)}
                        </span>
                      )}
                    </div>

                    {admin && (
                      <Link
                        to="/moderacao/$reportId"
                        params={{ reportId: report.reportId }}
                        className="text-xs text-primary hover:underline"
                      >
                        {texts.moderator.reports.openReview}
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className={cn(
                        "rounded-full gap-1.5",
                        report.myVote === "PUNISH" &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-surface-card",
                      )}
                      disabled={vote.isPending}
                      onClick={() => vote.mutate({ reportId: report.reportId, vote: "PUNISH" })}
                    >
                      <Check className="h-3.5 w-3.5" />

                      <>{texts.moderator.reports.punish}</>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "rounded-full gap-1.5",
                        report.myVote === "DISMISS" &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-surface-card",
                      )}
                      disabled={vote.isPending}
                      onClick={() => vote.mutate({ reportId: report.reportId, vote: "DISMISS" })}
                    >
                      <X className="h-3.5 w-3.5" />

                      <>{texts.moderator.reports.dismiss}</>
                    </Button>
                  </div>

                  {admin && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border-soft pt-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-text-subtle">
                        {texts.moderator.reports.adminActions}
                      </span>

                      {report.targetType === "POST" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={adminAction.isPending}
                          onClick={() => setRemoveTarget(report.reportId)}
                        >
                          {texts.moderator.reports.removePost}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={adminAction.isPending}
                        onClick={() =>
                          adminAction.mutate({ reportId: report.reportId, action: "warn" })
                        }
                      >
                        {texts.moderator.reports.warn}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title={texts.moderator.reports.removeTitle}
        description={texts.moderator.reports.removeBody}
        confirmLabel={texts.moderator.reports.removePost}
        destructive
        pending={adminAction.isPending}
        onConfirm={() => {
          if (!removeTarget) return;
          adminAction.mutate({ reportId: removeTarget, action: "remove" });
          setRemoveTarget(null);
        }}
      />
    </section>
  );
}

function ApplicationsSection() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "applications"],
    queryFn: () => moderationApi.applications(),
    retry: false,
  });

  const { data: moderators, isLoading: moderatorsLoading } = useQuery({
    queryKey: ["moderator", "moderators"],
    queryFn: () => moderationApi.moderators(),
    retry: false,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["moderator", "applications"] });
    void queryClient.invalidateQueries({ queryKey: ["moderator", "moderators"] });
    void queryClient.invalidateQueries({ queryKey: ["moderator", "me"] });
  };

  return (
    <div className="space-y-5">
      <AddModeratorForm onChanged={invalidate} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          {texts.moderator.admin.moderatorsTitle}
        </h2>

        {moderatorsLoading ? (
          <LoadingState />
        ) : (moderators?.length ?? 0) === 0 ? (
          <p className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-text-subtle">
            {texts.moderator.admin.moderatorsEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {moderators!.map((moderator) => (
              <ModeratorRow key={moderator.userId} moderator={moderator} onChanged={invalidate} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          {texts.moderator.admin.applicationsTitle}
        </h2>

        {isLoading ? (
          <LoadingState />
        ) : (data?.length ?? 0) === 0 ? (
          <p className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-text-subtle">
            {texts.moderator.admin.applicationsEmpty}
          </p>
        ) : (
          <ul className="space-y-3">
            {data!.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onDecided={invalidate}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ApplicationCard({
  application,
  onDecided,
}: {
  application: ModeratorApplicationView;
  onDecided: () => void;
}) {
  const { toast } = useToast();
  const [note, setNote] = useState("");

  const decide = useMutation({
    mutationFn: (approve: boolean) =>
      approve
        ? moderationApi.approveApplication(application.id, note.trim() || undefined)
        : moderationApi.rejectApplication(application.id, note.trim()),
    onSuccess: (_result, approve) => {
      toast(approve ? texts.moderator.admin.approved : texts.moderator.admin.rejected, "success");
      onDecided();
    },
    onError: () => toast(texts.moderator.admin.decisionError, "error"),
  });

  return (
    <li className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4">
      <p className="text-xs text-text-subtle">
        {texts.moderator.admin.applicant}:{" "}
        <span className="text-text-strong">
          {application.name ?? application.username ?? application.userId}
        </span>
        {application.username && <span> (@{application.username})</span>}
        {" · "}
        {new Date(application.createdAt).toLocaleString("pt-BR")}
      </p>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
          {texts.moderator.admin.motivation}
        </p>

        <p className="whitespace-pre-wrap text-sm text-text-strong">{application.motivation}</p>
      </div>

      {application.experience && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
            {texts.moderator.admin.experience}
          </p>

          <p className="whitespace-pre-wrap text-sm text-text-subtle">{application.experience}</p>
        </div>
      )}

      {application.availability && (
        <p className="text-xs text-text-subtle">
          {texts.moderator.admin.availability}: {application.availability}
        </p>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-text-strong">{texts.moderator.admin.note}</span>

        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder={texts.moderator.admin.notePlaceholder}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="rounded-full"
          disabled={decide.isPending}
          onClick={() => decide.mutate(true)}
        >
          {texts.moderator.admin.approve}
        </Button>

        <Button
          size="sm"
          variant="destructive"
          className="rounded-full"
          disabled={decide.isPending || note.trim().length < 5}
          onClick={() => decide.mutate(false)}
        >
          {texts.moderator.admin.reject}
        </Button>
      </div>
    </li>
  );
}

/** Nomeação direta: o admin digita o username e a pessoa já entra como moderadora. */
function AddModeratorForm({ onChanged }: { onChanged: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [note, setNote] = useState("");

  const appoint = useMutation({
    mutationFn: () => moderationApi.appoint(username.trim(), note.trim() || undefined),
    onSuccess: (result) => {
      toast(texts.moderator.admin.moderatorAdded(result.username ?? username.trim()), "success");
      setUsername("");
      setNote("");
      onChanged();
    },
    onError: () => toast(texts.moderator.admin.addModeratorError, "error"),
  });

  return (
    <section className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4">
      <h2 className="text-base font-medium">{texts.moderator.admin.addModeratorTitle}</h2>

      <p className="text-sm text-muted-foreground">
        {texts.moderator.admin.addModeratorDescription}
      </p>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (username.trim().length === 0) return;
          appoint.mutate();
        }}
      >
        <div className="space-y-1">
          <span className="text-sm font-medium text-text-strong">
            {texts.moderator.admin.username}
          </span>

          {/* Busca por NOME ou @username (mesmo picker do Pagar da carteira): a escolha
              resolve para o username — o identificador que a nomeação usa. */}
          <UserPicker
            value={username}
            onChange={setUsername}
            placeholder={texts.moderator.admin.usernamePlaceholder}
          />
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-text-strong">{texts.moderator.admin.note}</span>

          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            placeholder={texts.moderator.admin.notePlaceholder}
          />
        </label>

        <Button
          type="submit"
          size="sm"
          className="rounded-full"
          disabled={appoint.isPending || username.trim().length === 0}
        >
          {texts.moderator.admin.addModerator}
        </Button>
      </form>
    </section>
  );
}

function ModeratorRow({
  moderator,
  onChanged,
}: {
  moderator: ModeratorApplicationView;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const revoke = useMutation({
    mutationFn: () => moderationApi.revoke(moderator.userId),
    onSuccess: () => {
      toast(texts.moderator.admin.revoked, "success");
      setConfirmOpen(false);
      onChanged();
    },
    onError: () => toast(texts.moderator.admin.revokeError, "error"),
  });

  const label = moderator.name ?? moderator.username ?? moderator.userId;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-soft bg-surface-card p-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-text-strong">{label}</p>

        {moderator.username && (
          <p className="truncate text-xs text-text-subtle">@{moderator.username}</p>
        )}
      </div>

      <Button
        size="sm"
        variant="destructive"
        className="rounded-full"
        disabled={revoke.isPending}
        onClick={() => setConfirmOpen(true)}
      >
        {texts.moderator.admin.revoke}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={texts.moderator.admin.revokeTitle}
        description={texts.moderator.admin.revokeBody(moderator.username ?? label)}
        confirmLabel={texts.moderator.admin.revoke}
        destructive
        pending={revoke.isPending}
        onConfirm={() => revoke.mutate()}
      />
    </li>
  );
}

function SanctionSection({ me }: { me: ModeratorMeView }) {
  const votingEnabled = me.moderatorCount >= me.minModeratorsForSanction;

  return (
    <div className="space-y-4">
      {me.admin && <DirectSanctionForm />}

      {me.moderator &&
        (votingEnabled ? (
          <SanctionVoting />
        ) : (
          <section className="space-y-2 rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
            <h2 className="text-base font-medium">{texts.moderator.sanction.lockedTitle}</h2>

            <p className="text-sm text-muted-foreground">
              {texts.moderator.sanction.locked(me.moderatorCount, me.minModeratorsForSanction)}
            </p>
          </section>
        ))}

      <SanctionProposalQueue me={me} votingEnabled={votingEnabled} />
    </div>
  );
}

function DirectSanctionForm() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [type, setType] = useState<"RESTRICTION" | "BAN">("RESTRICTION");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sanction = useMutation({
    mutationFn: () => moderationApi.sanctionUser(username.trim(), type, reason.trim()),
    onSuccess: (result) => {
      toast(texts.moderator.admin.done(result.username, result.type), "success");
      setUsername("");
      setReason("");
      setType("RESTRICTION");
    },
    onError: () => toast(texts.moderator.admin.error, "error"),
  });

  const valid = username.trim().length > 0 && reason.trim().length >= 10;

  return (
    <section className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
      <h2 className="text-base font-medium">{texts.moderator.admin.sanctionTitle}</h2>

      <p className="text-sm text-muted-foreground">{texts.moderator.admin.sanctionDescription}</p>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          setConfirmOpen(true);
        }}
      >
        <label className="block space-y-1">
          <span className="text-sm font-medium text-text-strong">
            {texts.moderator.admin.username}
          </span>

          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={80}
            placeholder={texts.moderator.admin.usernamePlaceholder}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-text-strong">{texts.moderator.admin.type}</span>

          <select
            value={type}
            onChange={(event) => setType(event.target.value as "RESTRICTION" | "BAN")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
          >
            <option value="RESTRICTION">{texts.moderator.admin.restriction}</option>

            <option value="BAN">{texts.moderator.admin.ban}</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-text-strong">
            {texts.moderator.admin.reason}
          </span>

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder={texts.moderator.admin.reasonPlaceholder}
          />
        </label>

        <Button type="submit" variant="destructive" className="rounded-full" disabled={!valid}>
          {texts.moderator.admin.apply}
        </Button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={texts.moderator.admin.confirmTitle}
        description={texts.moderator.admin.confirmBody(username.trim(), type)}
        confirmLabel={texts.moderator.admin.apply}
        destructive
        pending={sanction.isPending}
        onConfirm={() => {
          setConfirmOpen(false);
          sanction.mutate();
        }}
      />
    </section>
  );
}

/** Proposta de punição: o moderação vota e o limiar é recalculado pelo backend. */
function SanctionVoting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [type, setType] = useState<"RESTRICTION" | "BAN">("RESTRICTION");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const propose = useMutation({
    mutationFn: () => moderationApi.proposeSanction(username.trim(), type, reason.trim()),
    onSuccess: () => {
      toast(texts.moderator.sanction.proposed, "success");
      setUsername("");
      setReason("");
      setType("RESTRICTION");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "sanction-proposals"] });
    },
    onError: (error) =>
      toast(
        error instanceof Error ? error.message : texts.moderator.sanction.proposeError,
        "error",
      ),
  });

  const valid = username.trim().length > 0 && reason.trim().length >= 10;

  return (
    <section className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
      <h2 className="text-base font-medium">{texts.moderator.sanction.title}</h2>

      <p className="text-sm text-muted-foreground">{texts.moderator.sanction.description}</p>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          setConfirmOpen(true);
        }}
      >
        <label className="block space-y-1">
          <span className="text-sm font-medium text-text-strong">
            {texts.moderator.sanction.target}
          </span>

          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={80}
            placeholder={texts.moderator.sanction.targetPlaceholder}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-text-strong">
            {texts.moderator.sanction.type}
          </span>

          <select
            value={type}
            onChange={(event) => setType(event.target.value as "RESTRICTION" | "BAN")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
          >
            <option value="RESTRICTION">{texts.moderator.admin.restriction}</option>

            <option value="BAN">{texts.moderator.admin.ban}</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-text-strong">
            {texts.moderator.sanction.reason}
          </span>

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder={texts.moderator.sanction.reasonPlaceholder}
          />
        </label>

        <Button type="submit" variant="destructive" className="rounded-full" disabled={!valid}>
          {texts.moderator.sanction.propose}
        </Button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={texts.moderator.admin.confirmTitle}
        description={texts.moderator.admin.confirmBody(username.trim(), type)}
        confirmLabel={texts.moderator.sanction.propose}
        destructive
        pending={propose.isPending}
        onConfirm={() => {
          setConfirmOpen(false);
          propose.mutate();
        }}
      />
    </section>
  );
}

function SanctionProposalQueue({
  me,
  votingEnabled,
}: {
  me: ModeratorMeView;
  votingEnabled: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "sanction-proposals"],
    queryFn: () => moderationApi.sanctionProposals(),
    retry: false,
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
        {texts.moderator.sanction.queueTitle}
      </h2>

      {isLoading ? (
        <LoadingState />
      ) : (data?.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-text-subtle">
          {texts.moderator.sanction.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {data!.map((proposal) => (
            <SanctionProposalCard
              key={proposal.id}
              proposal={proposal}
              me={me}
              votingEnabled={votingEnabled}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function SanctionProposalCard({
  proposal,
  me,
  votingEnabled,
}: {
  proposal: SanctionProposalView;
  me: ModeratorMeView;
  votingEnabled: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const vote = useMutation({
    mutationFn: (value: "APPROVE" | "REJECT") =>
      moderationApi.voteSanction(proposal.id, value, note.trim() || undefined),
    onSuccess: (result: SanctionProposalDecision) => {
      toast(result.message || texts.moderator.sanction.voted, "success");
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "sanction-proposals"] });
      void queryClient.invalidateQueries({ queryKey: ["moderator", "me"] });
    },
    onError: () => toast(texts.moderator.sanction.voteError, "error"),
  });

  const cancel = useMutation({
    mutationFn: () => moderationApi.cancelSanction(proposal.id),
    onSuccess: () => {
      toast(texts.moderator.sanction.cancelled, "success");
      setConfirmCancel(false);
      void queryClient.invalidateQueries({ queryKey: ["moderator", "sanction-proposals"] });
    },
    onError: () => toast(texts.moderator.sanction.cancelError, "error"),
  });

  return (
    <li className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-text-strong">
            <span className="font-medium">@{proposal.targetUsername}</span>
            {proposal.targetName && (
              <span className="text-text-subtle"> · {proposal.targetName}</span>
            )}
          </p>

          {proposal.proposer && (
            <p className="text-xs text-text-subtle">
              {texts.moderator.sanction.proposedBy(proposal.proposer)}
            </p>
          )}
        </div>

        <span className="rounded-full border border-border-soft px-2.5 py-1 text-xs font-medium text-text-subtle">
          {proposal.type === "BAN" ? texts.moderator.admin.ban : texts.moderator.admin.restriction}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-sm text-text-strong">{proposal.reason}</p>

      <p className="text-sm text-text-subtle">
        {texts.moderator.sanction.progress(
          proposal.approveVotes,
          proposal.rejectVotes,
          proposal.requiredVotes,
        )}
      </p>

      {proposal.myVote && (
        <p className="text-xs text-text-subtle">
          {proposal.myVote === "APPROVE"
            ? texts.moderator.sanction.myVoteApprove
            : texts.moderator.sanction.myVoteReject}
        </p>
      )}

      {me.moderator && votingEnabled && proposal.status === "PENDING" && (
        <div className="space-y-2">
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            placeholder={texts.moderator.sanction.notePlaceholder}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={vote.isPending}
              onClick={() => vote.mutate("APPROVE")}
            >
              <Check className="mr-1 h-3.5 w-3.5" />

              <>{texts.moderator.sanction.approve}</>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={vote.isPending}
              onClick={() => vote.mutate("REJECT")}
            >
              <X className="mr-1 h-3.5 w-3.5" />

              <>{texts.moderator.sanction.reject}</>
            </Button>
          </div>
        </div>
      )}

      {me.admin && proposal.status === "PENDING" && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={cancel.isPending}
            onClick={() => setConfirmCancel(true)}
          >
            {texts.moderator.sanction.cancel}
          </Button>

          <ConfirmDialog
            open={confirmCancel}
            onOpenChange={setConfirmCancel}
            title={texts.moderator.sanction.cancelTitle}
            description={texts.moderator.sanction.cancelBody(proposal.targetUsername)}
            confirmLabel={texts.moderator.sanction.cancel}
            destructive
            pending={cancel.isPending}
            onConfirm={() => cancel.mutate()}
          />
        </>
      )}
    </li>
  );
}
