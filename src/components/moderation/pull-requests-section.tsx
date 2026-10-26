import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { OpenPullRequest } from "@/types/application/seals/open-pull-request";
import { ListRowSkeletons } from "@rede-enois/design-system/patterns";
import { Button, Textarea, useToast } from "@rede-enois/design-system/ui";
import { GitPullRequest, Loader2 } from "lucide-react";

import { authApi, contributorSealsApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";
import { safeHref } from "@/lib/safe-url";

/**
 * Fila de revisão dos PRs abertos dos repositórios oficiais. A revisão vai para o GitHub em nome de
 * quem revisa quando o vínculo tem escrita; sem isso o backend usa o token de serviço.
 */
export function PullRequestsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "github", "pulls"],
    queryFn: () => contributorSealsApi.openPullRequests(),
    retry: false,
    refetchInterval: 60_000,
  });

  const { data: github } = useQuery({
    queryKey: ["me", "github"],
    queryFn: () => contributorSealsApi.githubStatus(),
    retry: false,
  });

  const connectWrite = useMutation({
    mutationFn: () => authApi.oauthWriteLinkStart("GITHUB"),
    onSuccess: (start) => {
      window.location.href = start.authorizationUrl;
    },
    onError: () => toast(texts.moderator.pulls.reviewError, "error"),
  });

  const pulls = data ?? [];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["moderator", "github", "pulls"] });
  };

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          {texts.moderator.pulls.title}
        </h2>

        <p className="text-sm text-muted-foreground">{texts.moderator.pulls.description}</p>
      </div>

      {github?.linked && !github.writeAccess && (
        <div className="space-y-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm text-text-strong">{texts.moderator.pulls.writeHint}</p>

          <Button
            size="sm"
            className="rounded-full"
            disabled={connectWrite.isPending}
            onClick={() => connectWrite.mutate()}
          >
            {connectWrite.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <GitPullRequest className="h-3.5 w-3.5" />
            )}

            <>{texts.moderator.pulls.connectWrite}</>
          </Button>
        </div>
      )}

      {isLoading ? (
        <ListRowSkeletons />
      ) : pulls.length === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-center text-sm text-text-subtle">
          <GitPullRequest className="mx-auto mb-2 h-6 w-6 text-primary" />

          <>{texts.moderator.pulls.empty}</>
        </div>
      ) : (
        <ul className="space-y-3">
          {pulls.map((pull) => (
            <PullRequestRow
              key={`${pull.repository}#${pull.number}`}
              pull={pull}
              onReviewed={refresh}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PullRequestRow({ pull, onReviewed }: { pull: OpenPullRequest; onReviewed: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  const review = useMutation({
    mutationFn: (decision: "APPROVE" | "REQUEST_CHANGES") =>
      contributorSealsApi.reviewPullRequest({
        repository: pull.repository,
        number: pull.number,
        decision,
        comment: decision === "REQUEST_CHANGES" ? comment.trim() : undefined,
      }),
    onSuccess: (_result, decision) => {
      toast(
        decision === "APPROVE"
          ? texts.moderator.pulls.approved
          : texts.moderator.pulls.changesRequested,
        "success",
      );
      setOpen(false);
      setComment("");
      onReviewed();
    },
    onError: () => toast(texts.moderator.pulls.reviewError, "error"),
  });

  return (
    <li className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-subtle">
        <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-text-strong">
          {pull.repository}
        </span>

        <span>#{pull.number}</span>

        {pull.updatedAt && <span>{dataHora(pull.updatedAt)}</span>}
      </div>

      <div className="flex items-start gap-3">
        {pull.authorAvatarUrl && (
          <img
            src={pull.authorAvatarUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover"
            loading="lazy"
          />
        )}

        <div className="min-w-0 flex-1">
          <a
            href={safeHref(pull.url) ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-text-strong hover:underline"
          >
            {pull.title}
          </a>

          {pull.authorLogin && (
            <p className="mt-0.5 text-xs text-text-subtle">
              {texts.moderator.pulls.by(pull.authorLogin)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="rounded-full"
          disabled={review.isPending}
          onClick={() => review.mutate("APPROVE")}
        >
          {review.isPending && review.variables === "APPROVE" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}

          <>{texts.moderator.pulls.approve}</>
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={review.isPending}
          onClick={() => setOpen((value) => !value)}
        >
          <>{open ? texts.moderator.pulls.cancel : texts.moderator.pulls.requestChanges}</>
        </Button>

        <a
          href={safeHref(pull.url) ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-primary hover:underline"
        >
          {texts.moderator.pulls.openOnGithub}
        </a>
      </div>

      {open && (
        <div className="space-y-2 rounded-xl border border-border-soft bg-surface-1 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
            {texts.moderator.pulls.commentLabel}
          </p>

          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={texts.moderator.pulls.commentPlaceholder}
          />

          <Button
            size="sm"
            className="rounded-full"
            disabled={review.isPending || comment.trim().length < 5}
            onClick={() => review.mutate("REQUEST_CHANGES")}
          >
            {review.isPending && review.variables === "REQUEST_CHANGES" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}

            <>{texts.moderator.pulls.send}</>
          </Button>
        </div>
      )}
    </li>
  );
}
