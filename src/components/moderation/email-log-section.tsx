import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { EmailLogStatusFilter } from "@/types/application/moderation/email-log-status-filter";
import { ListRowSkeletons } from "@rede-enois/design-system/patterns";
import { Mail } from "lucide-react";

import { moderationApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";
import { cn } from "@/lib/utils";

/** Metadados dos e-mails enviados: útil para ver falha de SMTP sem abrir caixa de mensagens. */
export function EmailLogSection() {
  const [status, setStatus] = useState<EmailLogStatusFilter>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "emails"],
    queryFn: () => moderationApi.emails(100),
    retry: false,
  });

  const emails = (data ?? []).filter((item) => status === "ALL" || item.status === status);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          {texts.moderator.emails.title}
        </h2>

        <p className="text-sm text-muted-foreground">{texts.moderator.emails.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["ALL", texts.moderator.emails.all],
            ["SENT", texts.moderator.emails.sent],
            ["FAILED", texts.moderator.emails.failed],
          ] as [EmailLogStatusFilter, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatus(id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              status === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border-soft text-text-subtle hover:border-primary/50 hover:text-primary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ListRowSkeletons />
      ) : emails.length === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-center text-sm text-text-subtle">
          <Mail className="mx-auto mb-2 h-6 w-6 text-primary" />

          <>{texts.moderator.emails.empty}</>
        </div>
      ) : (
        <ul className="space-y-2">
          {emails.map((email) => (
            <li
              key={email.id}
              className="space-y-1 rounded-2xl border border-border-soft bg-surface-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium",
                    email.status === "SENT"
                      ? "bg-primary-soft text-primary-text"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {texts.moderator.emails.status[email.status] ?? email.status}
                </span>

                <span className="text-text-subtle">{dataHora(email.createdAt)}</span>
              </div>

              <p className="text-sm font-medium text-text-strong">
                {email.kind === "TWO_FACTOR" ? texts.moderator.emails.redacted : email.subject}
              </p>

              <p className="text-xs text-text-subtle">
                {texts.moderator.emails.to}: {email.toEmail}
                {" · "}
                {email.kind.replaceAll("_", " ").toLowerCase()}
              </p>

              {email.error && (
                <p className="break-words text-xs text-destructive">
                  {texts.moderator.emails.error}: {email.error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
