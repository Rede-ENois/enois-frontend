import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ListRowSkeletons } from "@rede-enois/design-system/patterns";
import { Button, ConfirmDialog, EmptyState, Input, useToast } from "@rede-enois/design-system/ui";
import { Check, ShieldAlert, Trash2 } from "lucide-react";

import { moderationApi } from "@/lib/api";
import { cn } from "@/lib/utils";

function signalsOf(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as { signals?: unknown };
    return Array.isArray(parsed.signals) ? parsed.signals.map(String) : [];
  } catch {
    return [];
  }
}

/** Posts denunciados com score alto: revisão e exclusão em lote com motivo auditável. */
export function SuspiciousPostsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const query = useQuery({
    queryKey: ["moderator", "suspicious-posts"],
    queryFn: () => moderationApi.suspiciousPosts(30, 50),
    retry: false,
  });

  const items = useMemo(() => query.data ?? [], [query.data]);
  const allSelected = items.length > 0 && items.every((item) => selected.has(item.postId));

  const remove = useMutation({
    mutationFn: () => moderationApi.bulkDeleteSuspiciousPosts([...selected], reason.trim()),
    onSuccess: (result) => {
      const deleted = result.items.filter((item) => item.status === "DELETED").length;
      const failed = result.items.length - deleted;
      setSelected(new Set());
      setReason("");
      setConfirmOpen(false);
      toast(texts.moderator.suspiciousPosts.result(deleted, failed), failed ? "error" : "success");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "suspicious-posts"] });
    },
    onError: (error) => {
      setConfirmOpen(false);
      toast(
        error instanceof Error ? error.message : texts.moderator.suspiciousPosts.error,
        "error",
      );
    },
  });

  const toggle = (postId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  if (query.isLoading) return <ListRowSkeletons />;
  if (query.isError) return null; // 403 = não é do time de moderação

  return (
    <section className="space-y-3" aria-label={texts.moderator.suspiciousPosts.title}>
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-primary" />

        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          {texts.moderator.suspiciousPosts.title}
        </h2>
      </div>

      <div className="surface-card space-y-3 p-4">
        <p className="text-sm text-text-subtle">{texts.moderator.suspiciousPosts.description}</p>

        {items.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={texts.moderator.suspiciousPosts.empty}
            description={texts.moderator.suspiciousPosts.emptyHint}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-auto rounded-full"
                onClick={() =>
                  setSelected(allSelected ? new Set() : new Set(items.map((item) => item.postId)))
                }
              >
                {allSelected
                  ? texts.moderator.suspiciousPosts.clear
                  : texts.moderator.suspiciousPosts.selectAll}
              </Button>

              <span className="text-xs text-text-subtle">
                {texts.moderator.suspiciousPosts.selected(selected.size)}
              </span>
            </div>

            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={300}
              placeholder={texts.moderator.suspiciousPosts.reasonPlaceholder}
            />

            <Button
              variant="destructive"
              size="sm"
              className="w-auto rounded-full gap-2"
              disabled={selected.size === 0 || reason.trim().length < 10}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />

              <>{texts.moderator.suspiciousPosts.delete(selected.size)}</>
            </Button>

            <ul className="space-y-2 pt-1">
              {items.map((item) => {
                const checked = selected.has(item.postId);
                return (
                  <li key={item.reportId}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border border-border-soft bg-surface-1 p-3",
                        checked && "border-primary/60 bg-primary-soft/40",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border-soft bg-surface-card",
                        )}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>

                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggle(item.postId)}
                      />

                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-text-strong">
                            {item.postId.slice(0, 18)}…
                          </span>

                          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-text">
                            {texts.moderator.suspiciousPosts.score(item.score)}
                          </span>

                          <span className="text-[11px] text-text-subtle">
                            {texts.moderator.suspiciousPosts.reason(item.reason)}
                          </span>
                        </span>

                        <span className="flex flex-wrap gap-1">
                          {signalsOf(item.signals).map((signal) => (
                            <span
                              key={signal}
                              className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-subtle"
                            >
                              {texts.moderator.suspiciousPosts.signals[signal] ?? signal}
                            </span>
                          ))}
                        </span>

                        <Link
                          to="/post/$postId"
                          params={{ postId: item.postId }}
                          target="_blank"
                          className="inline-block text-xs text-primary hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {texts.moderator.suspiciousPosts.openPost}
                        </Link>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title={texts.moderator.suspiciousPosts.confirmTitle}
              description={texts.moderator.suspiciousPosts.confirmBody(selected.size)}
              confirmLabel={texts.moderator.suspiciousPosts.confirm}
              destructive
              pending={remove.isPending}
              onConfirm={() => remove.mutate()}
            />
          </>
        )}
      </div>
    </section>
  );
}
