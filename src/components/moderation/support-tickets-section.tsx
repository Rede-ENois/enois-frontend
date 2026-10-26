import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { SupportCategory } from "@/types/application/support/support-category";
import type { SupportStatus } from "@/types/application/support/support-status";
import { ListRowSkeletons } from "@rede-enois/design-system/patterns";
import { Button, Textarea, useToast } from "@rede-enois/design-system/ui";
import { LifeBuoy } from "lucide-react";

import { supportApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";
import { safeHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

const CATEGORIES: SupportCategory[] = ["BUG", "ACCOUNT", "CONTENT", "IDEA", "OTHER"];

/** Filtros da fila ATIVA: o que está resolvido foi para a aba Histórico. */
const ACTIVE_STATUS_FILTERS: { id: SupportStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: texts.moderator.support.statusAll },
  { id: "OPEN", label: texts.moderator.support.statusOpen },
  { id: "IN_PROGRESS", label: texts.moderator.support.statusInProgress },
];

/**
 * Tickets de suporte do painel central. A aba "Issues" usa o mesmo componente com `lockedCategory`
 * em BUG: é a mesma fila, só enxergada pela categoria de problema.
 */
export function SupportTicketsSection({
  lockedCategory,
  mode = "active",
}: {
  lockedCategory?: SupportCategory;
  mode?: "active" | "history";
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [category, setCategory] = useState<SupportCategory | undefined>(lockedCategory);
  const [status, setStatus] = useState<SupportStatus | "ALL">("ALL");
  const history = mode === "history";

  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "support", category ?? "all", history ? "CLOSED" : status],
    queryFn: () =>
      supportApi.adminList({
        category,
        status: history ? "CLOSED" : status === "ALL" ? undefined : status,
        limit: 100,
      }),
    retry: false,
  });

  const move = useMutation({
    mutationFn: ({ id, next }: { id: string; next: SupportStatus }) =>
      supportApi.adminUpdate(id, { status: next }),
    onSuccess: () => {
      toast(texts.moderator.support.moved, "success");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "support"] });
    },
    onError: () => toast(texts.moderator.support.error, "error"),
  });

  // A fila ativa não mostra o que já foi concluído; o histórico é a única porta para CLOSED.
  const visible = history
    ? (data ?? [])
    : (data ?? []).filter((ticket) => ticket.status !== "CLOSED");

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          {history
            ? texts.moderator.tabs.history
            : lockedCategory
              ? texts.moderator.support.issuesTitle
              : texts.moderator.support.title}
        </h2>

        <p className="text-sm text-muted-foreground">
          {history
            ? texts.moderator.support.historyDescription
            : texts.moderator.support.description}
        </p>
      </div>

      <div className="space-y-2">
        {!lockedCategory && (
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              active={category === undefined}
              onClick={() => setCategory(undefined)}
              label={texts.moderator.support.all}
            />

            {CATEGORIES.map((value) => (
              <FilterChip
                key={value}
                active={category === value}
                onClick={() => setCategory(value)}
                label={texts.support.categories[value]}
              />
            ))}
          </div>
        )}

        {!history && (
          <div className="flex flex-wrap gap-1.5">
            {ACTIVE_STATUS_FILTERS.map((item) => (
              <FilterChip
                key={item.id}
                active={status === item.id}
                onClick={() => setStatus(item.id)}
                label={item.label}
              />
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <ListRowSkeletons />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-center text-sm text-text-subtle">
          <LifeBuoy className="mx-auto mb-2 h-6 w-6 text-primary" />

          <>{history ? texts.moderator.support.historyEmpty : texts.moderator.support.empty}</>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((ticket) => (
            <li
              key={ticket.id}
              className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-subtle">
                <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-text-strong">
                  {texts.support.categories[ticket.category] ?? ticket.category}
                </span>

                <span className="rounded-full border border-border-soft px-2 py-0.5">
                  {ticket.status === "OPEN"
                    ? texts.moderator.support.statusOpen
                    : ticket.status === "IN_PROGRESS"
                      ? texts.moderator.support.statusInProgress
                      : texts.moderator.support.statusClosed}
                </span>

                <span>{dataHora(ticket.createdAt)}</span>

                {ticket.githubIssueNumber != null && (
                  <a
                    href={safeHref(ticket.githubIssueUrl) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border-soft px-2 py-0.5 text-primary hover:underline"
                  >
                    {texts.moderator.support.githubIssue} #{ticket.githubIssueNumber}
                  </a>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-strong">{ticket.subject}</p>

                <p className="mt-0.5 text-xs text-text-subtle">
                  {texts.moderator.support.from}:{" "}
                  <a
                    href={`mailto:${ticket.contactEmail}`}
                    className="text-primary hover:underline"
                  >
                    {ticket.contactEmail}
                  </a>
                </p>
              </div>

              <p className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-surface-2 px-3 py-2 text-sm text-text-strong">
                {ticket.message || texts.moderator.support.noMessage}
              </p>

              {ticket.imageUrl && (
                <a
                  href={safeHref(ticket.imageUrl) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-primary hover:underline"
                >
                  {texts.moderator.support.image}
                </a>
              )}

              <div className="flex flex-wrap gap-2">
                {ticket.status === "OPEN" && (
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={move.isPending}
                    onClick={() => move.mutate({ id: ticket.id, next: "IN_PROGRESS" })}
                  >
                    {texts.moderator.support.start}
                  </Button>
                )}

                {ticket.status === "IN_PROGRESS" && (
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={move.isPending}
                    onClick={() => move.mutate({ id: ticket.id, next: "CLOSED" })}
                  >
                    {texts.moderator.support.resolve}
                  </Button>
                )}

                {ticket.status === "CLOSED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={move.isPending}
                    onClick={() => move.mutate({ id: ticket.id, next: "OPEN" })}
                  >
                    {texts.moderator.support.reopen}
                  </Button>
                )}
              </div>

              <TicketThread
                ticketId={ticket.id}
                mirrored={ticket.githubIssueNumber != null}
                legacyReply={ticket.adminReply}
                legacyRepliedAt={ticket.repliedAt}
              />
              <TicketReply ticketId={ticket.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TicketThread({
  ticketId,
  mirrored,
  legacyReply,
  legacyRepliedAt,
}: {
  ticketId: string;
  mirrored: boolean;
  legacyReply: string | null;
  legacyRepliedAt: string | null;
}) {
  const { data, isError } = useQuery({
    queryKey: ["moderator", "support", ticketId, "messages"],
    queryFn: () => supportApi.adminMessages(ticketId),
    retry: false,
  });
  const messages = data ?? [];

  if (messages.length === 0) {
    if (!legacyReply) return null;

    return (
      <div className="rounded-xl border border-primary/30 bg-primary-soft px-3 py-2">
        <p className="text-xs font-medium text-primary-text">
          {texts.moderator.support.adminReplyLabel}
        </p>

        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-text-strong">
          {legacyReply}
        </p>

        {legacyRepliedAt && (
          <p className="mt-1 text-xs text-text-subtle">{dataHora(legacyRepliedAt)}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border-soft bg-surface-1 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
        {texts.moderator.support.threadTitle}
      </p>

      {mirrored && <p className="text-xs text-text-subtle">{texts.moderator.support.threadHint}</p>}

      <ul className="space-y-2">
        {messages.map((message) => (
          <li key={message.id} className="rounded-lg bg-surface-card px-3 py-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-subtle">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium",
                  message.direction === "GITHUB"
                    ? "bg-surface-2 text-text-strong"
                    : "bg-primary-soft text-primary-text",
                )}
              >
                {message.direction === "GITHUB"
                  ? texts.moderator.support.threadGithub
                  : texts.moderator.support.threadEnos}
              </span>

              {(message.authorGithubLogin || message.authorName) && (
                <span>
                  {message.authorGithubLogin
                    ? `@${message.authorGithubLogin}`
                    : (message.authorName ?? "")}
                </span>
              )}

              <span>{dataHora(message.createdAt)}</span>
            </div>

            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-text-strong">
              {message.body}
            </p>
          </li>
        ))}
      </ul>

      {isError && <p className="text-xs text-destructive">{texts.moderator.support.threadError}</p>}
    </div>
  );
}

function TicketReply({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const reply = useMutation({
    mutationFn: () => supportApi.adminReply(ticketId, message.trim()),
    onSuccess: () => {
      toast(texts.moderator.support.replySent, "success");
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "support"] });
    },
    onError: () => toast(texts.moderator.support.replyError, "error"),
  });

  return (
    <div className="space-y-2 rounded-xl border border-border-soft bg-surface-1 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
        {texts.moderator.support.replyTitle}
      </p>

      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={3}
        maxLength={4000}
        placeholder={texts.moderator.support.replyPlaceholder}
      />

      <Button
        size="sm"
        className="rounded-full"
        disabled={reply.isPending || message.trim().length < 5}
        onClick={() => reply.mutate()}
      >
        {reply.isPending ? texts.common.sending : texts.moderator.support.replyAction}
      </Button>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-soft text-text-subtle hover:border-primary/50 hover:text-primary",
      )}
    >
      {label}
    </button>
  );
}
