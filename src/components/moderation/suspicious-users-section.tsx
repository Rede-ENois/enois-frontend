import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Check, ShieldAlert, ShieldCheck } from "lucide-react";

import { moderationApi } from "@/lib/api";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import { ListRowSkeletons } from "@/components/skeletons/list-row-skeletons";

/** Triagem de contas recém-criadas: sinais objetivos, seleção múltipla e banimento em lote. */
export function SuspiciousUsersSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"BAN" | "PERMABAN">("BAN");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const suspicious = useQuery({
    queryKey: ["moderator", "suspicious"],
    queryFn: () => moderationApi.suspiciousUsers(100, 90),
    retry: false,
  });

  const items = useMemo(() => suspicious.data?.items ?? [], [suspicious.data]);
  const allSelected = items.length > 0 && items.every((item) => selected.has(item.username));

  const ban = useMutation({
    mutationFn: () => moderationApi.bulkBan([...selected], type, reason.trim()),
    onSuccess: (result) => {
      setConfirmOpen(false);
      setSelected(new Set());
      setReason("");
      toast(
        texts.moderator.suspicious.result(result.banned, result.alreadyBanned, result.failed),
        result.failed > 0 ? "error" : "success",
      );
      // "N falha(s)" sozinho não diz o que aconteceu: quem falhou e por quê vem junto.
      const failures = result.items
        .filter((item) => item.status === "FAILED")
        .slice(0, 3)
        .map((item) => `@${item.username} (${item.message})`);
      if (failures.length > 0) {
        toast(texts.moderator.suspicious.failures(failures.join(", ")), "error");
      }
      void queryClient.invalidateQueries({ queryKey: ["moderator", "suspicious"] });
    },
    onError: (error) => {
      setConfirmOpen(false);
      toast(error instanceof Error ? error.message : texts.moderator.suspicious.error, "error");
    },
  });

  const toggle = (username: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.username)));
  };

  if (suspicious.isLoading) {
    return <ListRowSkeletons />;
  }

  if (suspicious.isError) {
    return <p className="text-sm text-destructive">{texts.moderator.suspicious.error}</p>;
  }

  return (
    <section className="space-y-4">
      <div className="surface-card space-y-1 p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldAlert className="h-5 w-5 text-primary" />

          <>{texts.moderator.suspicious.title}</>
        </h2>

        <p className="text-sm text-text-subtle">{texts.moderator.suspicious.description}</p>

        <p className="rounded-xl bg-primary-soft px-3 py-2 text-xs font-medium text-primary-text">
          {texts.moderator.suspicious.autoHint}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={ShieldCheck}
            title={texts.moderator.suspicious.empty}
            description={texts.moderator.suspicious.emptyHint}
          />
        </div>
      ) : (
        <>
          <div className="surface-card space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-auto rounded-full"
                onClick={toggleAll}
              >
                {allSelected
                  ? texts.moderator.suspicious.clear
                  : texts.moderator.suspicious.selectAll}
              </Button>

              <span className="text-xs text-text-subtle">
                {texts.moderator.suspicious.selected(selected.size)}
              </span>
            </div>

            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={300}
              placeholder={texts.moderator.suspicious.reasonPlaceholder}
            />

            {reason.trim().length > 0 && reason.trim().length < 10 && (
              <p className="text-xs text-destructive">
                {texts.moderator.suspicious.reasonMissing(10 - reason.trim().length)}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={type}
                onChange={(event) => setType(event.target.value as "BAN" | "PERMABAN")}
                className="h-9 rounded-full border border-border-soft bg-surface-1 px-3 text-sm text-text-strong"
              >
                <option value="BAN">{texts.moderator.suspicious.typeBan}</option>

                <option value="PERMABAN">{texts.moderator.suspicious.typePermanent}</option>
              </select>

              <Button
                variant="destructive"
                size="sm"
                className="w-auto rounded-full"
                disabled={selected.size === 0 || reason.trim().length < 10}
                onClick={() => setConfirmOpen(true)}
              >
                {texts.moderator.suspicious.ban(selected.size)}
              </Button>
            </div>
          </div>

          <ul className="space-y-2">
            {items.map((item) => {
              const checked = selected.has(item.username);
              return (
                <li key={item.username}>
                  <label
                    className={cn(
                      "surface-card flex cursor-pointer items-start gap-3 p-3 transition",
                      checked && "border-primary/60 bg-primary-soft/40",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border-soft bg-surface-1",
                      )}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>

                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggle(item.username)}
                    />

                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 truncate font-medium text-text-strong">
                          {item.name}
                        </span>

                        <span className="text-xs text-text-subtle">@{item.username}</span>

                        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-text">
                          {texts.moderator.suspicious.risk(item.riskScore)}
                        </span>
                      </span>

                      <span className="block text-xs text-text-subtle">
                        {texts.moderator.suspicious.createdAt(
                          new Date(item.createdAt).toLocaleDateString("pt-BR"),
                        )}
                        {" · "}
                        {texts.moderator.suspicious.counts(
                          item.posts,
                          item.comments,
                          item.reportsAgainst,
                        )}
                      </span>

                      <span className="flex flex-wrap gap-1 pt-0.5">
                        {item.signals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-subtle"
                          >
                            {texts.moderator.suspicious.signals[signal] ?? signal}
                          </span>
                        ))}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={texts.moderator.suspicious.confirmTitle}
            description={texts.moderator.suspicious.confirmBody(selected.size, type)}
            confirmLabel={texts.moderator.suspicious.confirm}
            destructive
            pending={ban.isPending}
            onConfirm={() => ban.mutate()}
          />
        </>
      )}
    </section>
  );
}
