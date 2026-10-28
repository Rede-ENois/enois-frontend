import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ContributorAdminView } from "@/types/application/contributors/contributor-admin-view";
import type { ContributorApplicationStatus } from "@/types/application/contributors/contributor-application-status";
import { Button } from "@rede-enois/design-system/ui";
import { BadgeCheck, Mail, RefreshCw, UserPlus } from "lucide-react";

import { contributorsApi } from "@/lib/api";
import { dataCurta, dataHora } from "@/lib/date/format";
import { cn } from "@/lib/utils";

import { GithubIcon } from "@/components/icons/github";
import { ListRowSkeletons } from "@/components/skeletons/list-row-skeletons";

/**
 * Painel de contribuintes.
 *
 * Quem tem contribuição verificada aparece sozinho, já aprovado pelo GitHub; o formulário da
 * landing serve só para confirmar os dados (sem triagem). Candidaturas da landing continuam na
 * fila manual (nova → análise → aprovar/recusar).
 */
export function ContributorsSection() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["moderator", "contributors"],
    queryFn: () => contributorsApi.adminPanel(),
    retry: false,
  });

  const rows = data ?? [];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
            {texts.moderator.contributors.title}
          </h2>

          <p className="text-sm text-muted-foreground">
            {texts.moderator.contributors.description}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          aria-label={texts.moderator.contributors.refresh}
          title={texts.moderator.contributors.refresh}
          onClick={() => void refetch()}
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </Button>
      </div>

      {isLoading ? (
        <ListRowSkeletons />
      ) : isError ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {texts.moderator.contributors.error}
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-center text-sm text-text-subtle">
          <UserPlus className="mx-auto mb-2 h-6 w-6 text-primary" />

          <>{texts.moderator.contributors.empty}</>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((application) => (
            <ContributorCard
              key={application.id ?? application.userId ?? application.github}
              application={application}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

const STATUS_BADGE: Record<ContributorApplicationStatus, string> = {
  NEW: "bg-primary-soft text-primary-text",
  REVIEWING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-growth/10 text-growth",
  REJECTED: "bg-destructive/10 text-destructive",
};

function ContributorCard({ application }: { application: ContributorAdminView }) {
  const queryClient = useQueryClient();

  const setStatus = useMutation({
    mutationFn: (status: ContributorApplicationStatus) =>
      contributorsApi.adminUpdateStatus(application.id!, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["moderator", "contributors"] });
    },
  });

  const status = application.status;
  const githubVerified = application.source === "GITHUB_VERIFIED";
  const canDecide = !githubVerified && application.id !== null;
  const decidida = status === "APPROVED" || status === "REJECTED";

  return (
    <li className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text-strong">{application.name}</p>

            {githubVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-text">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                {texts.moderator.contributors.verifiedByGithub}
              </span>
            ) : (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-text-subtle">
                {texts.moderator.contributors.landingSource}
              </span>
            )}
          </div>

          <p className="text-xs text-text-subtle">{dataHora(application.createdAt)}</p>
        </div>

        <span
          className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_BADGE[status])}
        >
          {texts.moderator.contributors.status[status]}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
          {texts.moderator.contributors.contact}
        </p>

        {/*
         * Login do GitHub e e-mail são texto do usuário e não têm espaço: sem `break-all` o item
         * de flex nasce com o min-content do e-mail e a página passa a rolar de lado no celular
         * (medido em 2026-10-27, Chrome headless a 390px: 40px de transbordo com e-mail real).
         */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <a
            href={`https://github.com/${application.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-1 break-all text-primary hover:underline"
          >
            <GithubIcon className="h-3.5 w-3.5 shrink-0" />@{application.github}
          </a>

          {application.email && (
            <a
              href={`mailto:${application.email}`}
              className="inline-flex min-w-0 items-center gap-1 break-all text-text-subtle hover:text-primary"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {application.email}
            </a>
          )}
        </div>
      </div>

      {application.sealName && (
        <p className="text-xs text-text-subtle">
          {texts.moderator.contributors.seal(application.sealName)}
          {application.evidenceCount != null
            ? ` · ${texts.moderator.contributors.evidence(application.evidenceCount)}`
            : ""}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {application.area && (
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-primary-text">
            {texts.moderator.contributors.area}: {application.area}
          </span>
        )}

        {application.experience && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-text-subtle">
            {texts.moderator.contributors.experience}: {application.experience}
          </span>
        )}

        {application.acceptedTermsAt && (
          <span className="text-text-subtle">
            {texts.moderator.contributors.acceptedAt}: {dataCurta(application.acceptedTermsAt)}
          </span>
        )}
      </div>

      {application.message && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
            {texts.moderator.contributors.title}
          </p>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-strong">
            {application.message}
          </p>
        </div>
      )}

      {application.formPending ? (
        <p className="rounded-xl bg-primary-soft px-3 py-2 text-xs text-primary-text">
          {texts.moderator.contributors.formPending}
        </p>
      ) : canDecide && !decidida ? (
        <div className="flex flex-wrap gap-2">
          {status === "NEW" && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("REVIEWING")}
            >
              {texts.moderator.contributors.review}
            </Button>
          )}

          <Button
            size="sm"
            className="rounded-full"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate("APPROVED")}
          >
            {texts.moderator.contributors.approve}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            className="rounded-full"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate("REJECTED")}
          >
            {texts.moderator.contributors.reject}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-text-subtle">
          {githubVerified
            ? texts.moderator.contributors.githubOnly
            : texts.moderator.contributors.done}
        </p>
      )}

      {setStatus.isError && (
        <p className="text-xs text-destructive">{texts.moderator.contributors.saveError}</p>
      )}
    </li>
  );
}
