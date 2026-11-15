import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PANEL_TABS, resolveActiveTab, visiblePanelGroups } from "@/routes/-moderador/panel-groups";
import { texts } from "@/texts";
import type { ModeratorApplicationView } from "@/types/application/moderation/moderator-application-view";
import type { ModeratorMeView } from "@/types/application/moderation/moderator-me-view";
import type { SanctionProposalDecision } from "@/types/application/moderation/sanction-proposal-decision";
import type { SanctionProposalView } from "@/types/application/moderation/sanction-proposal-view";
import type { ModeratorTabId } from "@/types/routes/moderador/moderator-tab-id";
import { ModeratorWorkspace } from "@rede-enois/design-system/domain";
import {
  Button,
  ConfirmDialog,
  Input,
  LoadingState,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import { ArrowLeft, Check, Shield, ShieldCheck, X } from "lucide-react";

import { moderationApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { AppealsSection } from "@/components/moderation/appeals-section";
import { ContributionsSection } from "@/components/moderation/contributions-section";
import { ContributorsSection } from "@/components/moderation/contributors-section";
import { DisputesSection } from "@/components/moderation/disputes-section";
import { EmailLogSection } from "@/components/moderation/email-log-section";
import { GamesReviewSection } from "@/components/moderation/games-review-section";
import { IdentityReleaseSection } from "@/components/moderation/identity-release-section";
import { MonitoringSection } from "@/components/moderation/monitoring-section";
import { NetworkNodesSection } from "@/components/moderation/network-nodes-section";
import { NotesSection } from "@/components/moderation/notes-section";
import { NoticesSection } from "@/components/moderation/notices-section";
import { PanicModeSection } from "@/components/moderation/panic-mode-section";
import { PenaltiesSection } from "@/components/moderation/penalties-section";
import { ProjectsReviewSection } from "@/components/moderation/projects-review-section";
import { PullRequestsSection } from "@/components/moderation/pull-requests-section";
import { ReleaseNotesSection } from "@/components/moderation/release-notes-section";
import { ReportsSection } from "@/components/moderation/reports-section";
import { SuggestionsSection } from "@/components/moderation/suggestions-section";
import { SupportTicketsSection } from "@/components/moderation/support-tickets-section";
import { SuspiciousPostsSection } from "@/components/moderation/suspicious-posts-section";
import { SuspiciousUsersSection } from "@/components/moderation/suspicious-users-section";
import { UserPicker } from "@/components/user-picker";

export const Route = createFileRoute("/moderador")({
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>): { aba?: ModeratorTabId } => {
    const requested = PANEL_TABS.find((item) => item.id === search.aba);
    return requested ? { aba: requested.id } : {};
  },
  head: () => ({ meta: [{ title: texts.moderator.seoTitle }] }),
  component: Moderador,
});

function Moderador() {
  const { aba: tab = "reports" } = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: me,
    isPending,
    error,
  } = useQuery({
    queryKey: ["moderator", "me"],
    queryFn: () => moderationApi.me(),
    retry: false,
  });

  if (isPending) {
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
  const activeTab = resolveActiveTab(tab, me.admin);
  // Os grupos visíveis: quem não é admin não vê o grupo de administração (que ficaria vazio).
  const groups = visiblePanelGroups(me.admin);

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-6xl space-y-6">
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

        {me.admin && <PanicModeSection compact />}

        {canModerate ? (
          <ModeratorWorkspace
            groups={groups.map(({ group, tabs }) => ({ ...group, tabs }))}
            activeTab={activeTab}
            onTabChange={(requested) => {
              const selected = groups
                .flatMap(({ tabs }) => tabs)
                .find((item) => item.id === requested);
              if (selected) void navigate({ search: { aba: selected.id } });
            }}
          >
            {activeTab === "reports" && <ReportsSection admin={me.admin} />}
            {activeTab === "games" && <GamesReviewSection />}
            {activeTab === "projects" && <ProjectsReviewSection />}
            {canModerate && activeTab === "support" && <SupportTicketsSection mode="active" />}
            {canModerate && activeTab === "suggestions" && <SuggestionsSection />}
            {canModerate && activeTab === "issues" && (
              <SupportTicketsSection lockedCategory="BUG" mode="active" />
            )}
            {canModerate && activeTab === "history" && <SupportTicketsSection mode="history" />}
            {canModerate && activeTab === "appeals" && <AppealsSection />}
            {canModerate && activeTab === "disputes" && <DisputesSection />}
            {me.admin && activeTab === "applications" && <ApplicationsSection />}
            {activeTab === "users" && <SanctionSection me={me} />}
            {canModerate && activeTab === "suspicious" && <SuspiciousUsersSection />}
            {canModerate && activeTab === "suspiciousPosts" && <SuspiciousPostsSection />}
            {canModerate && activeTab === "emails" && <EmailLogSection />}
            {canModerate && activeTab === "monitoring" && <MonitoringSection />}
            {me.admin && activeTab === "contributors" && <ContributorsSection />}
            {me.admin && activeTab === "githubContributions" && <ContributionsSection />}
            {canModerate && activeTab === "pulls" && <PullRequestsSection />}
            {canModerate && activeTab === "notes" && <NotesSection />}
            {me.admin && activeTab === "notices" && <NoticesSection />}
            {me.admin && activeTab === "releaseNotes" && <ReleaseNotesSection />}
            {me.admin && activeTab === "identityRelease" && <IdentityReleaseSection />}
            {me.admin && activeTab === "network" && <NetworkNodesSection />}
          </ModeratorWorkspace>
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
              aria-label={texts.moderator.eligibility.motivationPlaceholder}
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
              aria-label={texts.moderator.eligibility.experiencePlaceholder}
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
              aria-label={texts.moderator.eligibility.availabilityPlaceholder}
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

function AdminsSection({ onChanged }: { onChanged: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  const { data: admins, isLoading } = useQuery({
    queryKey: ["moderator", "admins"],
    queryFn: () => moderationApi.admins(),
    retry: false,
  });

  const promover = useMutation({
    mutationFn: () => moderationApi.promoteAdmin(username.trim()),
    onSuccess: (_result, _vars) => {
      toast(texts.moderator.admin.adminsPromoted(username.trim()), "success");
      setUsername("");
      onChanged();
    },
    onError: () => toast(texts.moderator.admin.adminsRevokeError, "error"),
  });

  const revogar = useMutation({
    mutationFn: (target: string) => moderationApi.revokeAdmin(target),
    onSuccess: () => {
      setRevoking(null);
      onChanged();
    },
    onError: () => {
      setRevoking(null);
      toast(texts.moderator.admin.adminsRevokeError, "error");
    },
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
        {texts.moderator.admin.adminsTitle}
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder={texts.moderator.admin.adminsAddPlaceholder}
          aria-label={texts.moderator.admin.adminsAddLabel}
          className="max-w-xs"
        />

        <Button
          size="sm"
          disabled={promover.isPending || username.trim().length === 0}
          onClick={() => promover.mutate()}
        >
          {texts.moderator.admin.adminsAdd}
        </Button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (admins?.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-text-subtle">
          {texts.moderator.admin.adminsEmpty}
        </p>
      ) : (
        <ul className="space-y-2">
          {admins!.map((admin) => (
            <li
              key={admin.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-soft bg-surface-card p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-text-strong">{admin.name ?? admin.username}</p>

                <p className="truncate text-xs text-text-subtle">@{admin.username}</p>
              </div>

              <Button
                size="sm"
                variant="destructive"
                className="rounded-full"
                disabled={revogar.isPending}
                onClick={() => setRevoking(admin.username)}
              >
                {texts.moderator.admin.adminsRevoke}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        title={texts.moderator.admin.adminsRevokeTitle}
        description={texts.moderator.admin.adminsRevokeBody(revoking ?? "")}
        confirmLabel={texts.moderator.admin.adminsRevoke}
        destructive
        pending={revogar.isPending}
        onConfirm={() => revoking && revogar.mutate(revoking)}
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
    void queryClient.invalidateQueries({
      queryKey: ["moderator", "applications"],
    });
    void queryClient.invalidateQueries({
      queryKey: ["moderator", "moderators"],
    });
    void queryClient.invalidateQueries({ queryKey: ["moderator", "me"] });
  };

  return (
    <div className="space-y-5">
      <AdminsSection onChanged={invalidate} />
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
        {dataHora(application.createdAt)}
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
      {(me.moderator || me.admin) && <DirectSanctionForm />}

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

      {/* Só o admin corrige penalidade já aplicada; o moderador vê o que a API libera. */}
      {me.admin && <PenaltiesSection />}
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
            aria-label={texts.moderator.admin.usernamePlaceholder}
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
            aria-label={texts.moderator.admin.reasonPlaceholder}
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
      void queryClient.invalidateQueries({
        queryKey: ["moderator", "sanction-proposals"],
      });
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
            aria-label={texts.moderator.sanction.targetPlaceholder}
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
            aria-label={texts.moderator.sanction.reasonPlaceholder}
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
      void queryClient.invalidateQueries({
        queryKey: ["moderator", "sanction-proposals"],
      });
      void queryClient.invalidateQueries({ queryKey: ["moderator", "me"] });
    },
    onError: () => toast(texts.moderator.sanction.voteError, "error"),
  });

  const cancel = useMutation({
    mutationFn: () => moderationApi.cancelSanction(proposal.id),
    onSuccess: () => {
      toast(texts.moderator.sanction.cancelled, "success");
      setConfirmCancel(false);
      void queryClient.invalidateQueries({
        queryKey: ["moderator", "sanction-proposals"],
      });
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
            aria-label={texts.moderator.sanction.notePlaceholder}
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
