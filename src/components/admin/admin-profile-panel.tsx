import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { AdminHistoryRowView } from "@/types/application/moderation/admin-history-row-view";
import type { AdminHistoryView } from "@/types/application/moderation/admin-history-view";
import type { AdminProfilePanelProps } from "@/types/components/admin/admin-profile-panel-props";
import type { AdminHistoryRowData, AdminProfileAction } from "@rede-enois/design-system/domain";
import {
  AdminProfileActionsSection,
  type AdminProfileActionsSectionProps,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, moderationApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";

import { AdminSupporterSealButton } from "./admin-supporter-seal-button";

/** Rótulos das sanções como o histórico as desenha (o tipo vem da API, em caixa alta). */
const TIPO = {
  WARNING: "Advertência",
  RESTRICTION: "Restrição",
  SUSPENDED: "Suspensão",
  BAN: "Banimento",
  PERMABAN: "Banimento permanente",
} as const;

function rotulo(row: AdminHistoryRowView): string {
  return TIPO[row.type as keyof typeof TIPO] ?? row.type;
}

/**
 * Bloco administrativo do perfil: advertir, sancionar (restrição, suspensão, banimento) e ler o
 * histórico da conta — aplicado direto, sem denúncia e sem votação.
 *
 * Só é montado para admin da plataforma; e mesmo assim cada ação passa por `/admin/moderation/**`,
 * que o backend recusa para qualquer outro papel. A tela nunca decide permissão: repete o que a
 * API deixou.
 */
export function AdminProfilePanel({ username }: { username: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const copy = texts.platformAdmin.profile;
  const [error, setError] = useState<string | null>(null);

  const history = useQuery({
    queryKey: ["admin-user-history", username],
    queryFn: () => moderationApi.adminUserHistory(username),
    retry: false,
  });

  const view = history.data as AdminHistoryView | undefined;
  const rows: AdminHistoryRowData[] = (view?.rows ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    typeLabel: rotulo(row),
    reason: row.reason,
    active: row.active,
    createdAtLabel: dataCurta(row.createdAt),
    dueAtLabel: row.dueAt ? dataCurta(row.dueAt) : null,
  }));
  const activeWarnings = (view?.rows ?? []).filter(
    (row) => row.kind === "WARNING" && row.active,
  ).length;

  // Toda ação invalida o histórico: a decisão já gravou a linha nova, e a tela mostra o de fato.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-user-history", username] });
    void queryClient.invalidateQueries({ queryKey: ["profile", username] });
  };

  const warn = useMutation({
    mutationFn: (reason: string) => moderationApi.adminWarnUser(username, reason),
    onSuccess: () => {
      setError(null);
      toast(copy.warning, "success");
      refresh();
    },
    onError: (failure: Error) =>
      setError(failure instanceof ApiError ? failure.message : copy.actionError),
  });

  const sanction = useMutation({
    mutationFn: ({ type, reason }: { type: Exclude<AdminProfileAction, "WARN">; reason: string }) =>
      moderationApi.adminSanctionUser(username, type, reason),
    onSuccess: () => {
      setError(null);
      toast(copy.sanction, "success");
      refresh();
    },
    onError: (failure: Error) =>
      setError(failure instanceof ApiError ? failure.message : copy.actionError),
  });

  // A conta some do banco de gente: sem sessão e sem perfil, o perfil aberto deixa de existir — a
  // tela volta para o feed em vez de mostrar um "@" que acabou de sair.
  const deleteAccount = useMutation({
    mutationFn: (reason: string) => moderationApi.adminDeleteAccount(username, reason),
    onSuccess: () => {
      setError(null);
      toast(copy.accountDeleted, "success");
      void router.navigate({ to: "/feed" });
    },
    onError: (failure: Error) =>
      setError(failure instanceof ApiError ? failure.message : copy.accountDeleteError),
  });

  const revoke = useMutation({
    mutationFn: ({ warningId, reason }: { warningId: string; reason: string }) =>
      moderationApi.adminRevokeWarning(warningId, reason),
    onSuccess: () => {
      setError(null);
      toast(copy.warningRevoked, "success");
      refresh();
    },
    onError: (failure: Error) =>
      setError(failure instanceof ApiError ? failure.message : copy.actionError),
  });

  // Tipado pelo contrato do app, não pelo contrato do DS instalado (ver `AdminProfilePanelProps`).
  const Section = AdminProfileActionsSection as unknown as (
    props: AdminProfilePanelProps,
  ) => React.ReactNode;

  return (
    <div className="space-y-3">
      {/*
        O selo de apoiador registrado à mão vem ANTES da seção do design system: é uma ação
        administrativa a mais na mesma tela, e o DS instalado não tem onde encaixar um botão. Só é
        montado para admin, como o resto do painel, e o backend recusa qualquer outro papel.
      */}
      <AdminSupporterSealButton username={username} />
      <Section
        profile={{ username, activeWarnings }}
        history={rows}
        loading={history.isLoading}
        error={history.isError}
        pending={
          warn.isPending || sanction.isPending || revoke.isPending || deleteAccount.isPending
        }
        onWarn={async (reason) => {
          try {
            await warn.mutateAsync(reason);
            return true;
          } catch {
            return false;
          }
        }}
        onSanction={async (punishment, reason) => {
          try {
            await sanction.mutateAsync({ type: punishment.type, reason });
            return true;
          } catch {
            return false;
          }
        }}
        onDeleteAccount={async (reason) => {
          try {
            await deleteAccount.mutateAsync(reason);
            return true;
          } catch {
            return false;
          }
        }}
        onRevokeWarning={async (warningId, reason) => {
          try {
            await revoke.mutateAsync({ warningId, reason });
            return true;
          } catch {
            return false;
          }
        }}
      />
    </div>
  );
}
