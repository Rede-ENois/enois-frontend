import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { AdminSanctionView } from "@/types/application/moderation/admin-sanction-view";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  LoadingState,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import { PencilLine, Undo2 } from "lucide-react";

import { sanctionsApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

const TYPE_LABELS: Record<AdminSanctionView["type"], string> = {
  RESTRICTION: texts.moderator.penalties.typeRestriction,
  SUSPENDED: texts.moderator.penalties.typeSuspended,
  BAN: texts.moderator.penalties.typeBan,
  PERMABAN: texts.moderator.penalties.typePermaban,
};

function label(sanction: AdminSanctionView): string {
  return sanction.username ?? sanction.name ?? "conta sem perfil";
}

const EDITABLE_TYPES: AdminSanctionView["type"][] = ["RESTRICTION", "SUSPENDED", "BAN", "PERMABAN"];

/**
 * Penalidades de toda a rede, para o admin corrigir o que foi aplicado por engano: remover
 * (a conta volta ao normal) ou ajustar tipo e motivo sem apagar o registro.
 */
export function PenaltiesSection() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"ACTIVE" | "REMOVED">("ACTIVE");
  const [revoking, setRevoking] = useState<AdminSanctionView | null>(null);
  const [editing, setEditing] = useState<AdminSanctionView | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["moderator", "sanctions", status],
    queryFn: () => sanctionsApi.adminSanctions(status),
    retry: false,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["moderator", "sanctions"] });
    void queryClient.invalidateQueries({ queryKey: ["pending-appeals"] });
  };

  const rows = data ?? [];

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-medium">{texts.moderator.penalties.title}</h2>

        <p className="text-sm text-muted-foreground">{texts.moderator.penalties.description}</p>
      </div>

      <div className="flex gap-2">
        {(["ACTIVE", "REMOVED"] as const).map((item) => (
          <Button
            key={item}
            size="sm"
            variant={status === item ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setStatus(item)}
          >
            {item === "ACTIVE"
              ? texts.moderator.penalties.filterActive
              : texts.moderator.penalties.filterRemoved}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-text-subtle">
          {texts.moderator.penalties.loadError}
        </p>
      ) : isLoading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState
          title={
            status === "ACTIVE"
              ? texts.moderator.penalties.emptyActive
              : texts.moderator.penalties.emptyRemoved
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((sanction) => (
            <PenaltyCard
              key={sanction.id}
              sanction={sanction}
              onRevoke={() => setRevoking(sanction)}
              onEdit={() => setEditing(sanction)}
            />
          ))}
        </ul>
      )}

      {revoking && (
        <RevokePenaltyDialog
          sanction={revoking}
          onClose={() => setRevoking(null)}
          onDone={invalidate}
        />
      )}

      {editing && (
        <EditPenaltyDialog
          key={editing.id}
          sanction={editing}
          onClose={() => setEditing(null)}
          onDone={invalidate}
        />
      )}
    </section>
  );
}

export function PenaltyCard({
  sanction,
  onRevoke,
  onEdit,
}: {
  sanction: AdminSanctionView;
  onRevoke: () => void;
  onEdit: () => void;
}) {
  const who = sanction.username ? `@${sanction.username}` : label(sanction);

  return (
    <li className="space-y-2 rounded-2xl border border-border-soft bg-surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-text-strong">
            <span className="font-medium">{who}</span>

            {sanction.name && <span className="text-text-subtle"> · {sanction.name}</span>}
          </p>

          <p className="text-xs text-text-subtle">
            {sanction.status === "ACTIVE"
              ? texts.moderator.penalties.createdAt(dataHora(sanction.createdAt))
              : sanction.removedAt
                ? texts.moderator.penalties.removedAt(dataHora(sanction.removedAt))
                : texts.moderator.penalties.createdAt(dataHora(sanction.createdAt))}
          </p>
        </div>

        <span className="rounded-full border border-border-soft px-2.5 py-1 text-xs font-medium text-text-subtle">
          {TYPE_LABELS[sanction.type]}
        </span>
      </div>

      {sanction.reason && (
        <p className="whitespace-pre-wrap text-sm text-text-strong">{sanction.reason}</p>
      )}

      {sanction.status === "ACTIVE" && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" className="rounded-full" onClick={onEdit}>
            <PencilLine className="mr-1 h-3.5 w-3.5" />

            <>{texts.moderator.penalties.edit}</>
          </Button>

          <Button size="sm" variant="destructive" className="rounded-full" onClick={onRevoke}>
            <Undo2 className="mr-1 h-3.5 w-3.5" />

            <>{texts.moderator.penalties.revoke}</>
          </Button>
        </div>
      )}
    </li>
  );
}

function RevokePenaltyDialog({
  sanction,
  onClose,
  onDone,
}: {
  sanction: AdminSanctionView;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const revoke = useMutation({
    mutationFn: () => sanctionsApi.revokeSanction(sanction.id, reason.trim()),
    onSuccess: () => {
      toast(texts.moderator.penalties.revoked(label(sanction)), "success");
      reset();
      onDone();
    },
    onError: (failure) =>
      toast(
        failure instanceof Error ? failure.message : texts.moderator.penalties.revokeError,
        "error",
      ),
  });

  const reset = () => {
    setReason("");
    setConfirmOpen(false);
    onClose();
  };

  const valid = reason.trim().length >= 10;

  return (
    <Dialog open onOpenChange={(open) => !open && reset()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.moderator.penalties.revokeTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-text-subtle">
            {texts.moderator.penalties.revokeBody(label(sanction))}
          </p>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-text-strong">
              {texts.moderator.penalties.revokeReason}
            </span>

            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={texts.moderator.penalties.revokeReasonPlaceholder}
            />
          </label>

          {!valid && reason.length > 0 && (
            <p className="text-xs text-text-subtle">{texts.moderator.penalties.reasonRequired}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            {texts.moderator.penalties.cancel}
          </Button>

          <Button
            variant="destructive"
            className="rounded-full"
            disabled={!valid || revoke.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {texts.moderator.penalties.revoke}
          </Button>
        </DialogFooter>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={texts.moderator.penalties.revokeTitle}
          description={texts.moderator.penalties.revokeBody(label(sanction))}
          confirmLabel={texts.moderator.penalties.revoke}
          destructive
          pending={revoke.isPending}
          onConfirm={() => {
            setConfirmOpen(false);
            revoke.mutate();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditPenaltyDialog({
  sanction,
  onClose,
  onDone,
}: {
  sanction: AdminSanctionView;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  // Montado por penalidade (key no pai): o formulário nasce com o estado atual dela.
  const [type, setType] = useState<AdminSanctionView["type"]>(sanction.type);
  const [reason, setReason] = useState(sanction.reason ?? "");

  const edit = useMutation({
    mutationFn: () => sanctionsApi.editSanction(sanction.id, type, reason.trim()),
    onSuccess: () => {
      toast(texts.moderator.penalties.edited(label(sanction)), "success");
      onClose();
      onDone();
    },
    onError: (failure) =>
      toast(
        failure instanceof Error ? failure.message : texts.moderator.penalties.editError,
        "error",
      ),
  });

  const reset = onClose;

  const valid = reason.trim().length >= 10;

  return (
    <Dialog open onOpenChange={(open) => !open && reset()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.moderator.penalties.editTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-text-subtle">
            {texts.moderator.penalties.editBody(label(sanction))}
          </p>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-text-strong">
              {texts.moderator.penalties.editType}
            </span>

            <select
              value={type}
              onChange={(event) => setType(event.target.value as AdminSanctionView["type"])}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
            >
              {EDITABLE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {TYPE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-text-strong">
              {texts.moderator.penalties.editReason}
            </span>

            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={texts.moderator.penalties.editReasonPlaceholder}
            />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={reset}>
            {texts.moderator.penalties.cancel}
          </Button>

          <Button
            className="rounded-full"
            disabled={!valid || edit.isPending}
            onClick={() => edit.mutate()}
          >
            {edit.isPending ? texts.moderator.penalties.pending : texts.moderator.penalties.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
