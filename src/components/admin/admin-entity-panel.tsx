import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { AdminEntityKind } from "@/types/application/admin-entity/admin-entity-kind";
import type { AdminEntityOutcome } from "@/types/application/admin-entity/admin-entity-outcome";
import type { AdminEntityPanelProps } from "@/types/application/admin-entity/admin-entity-panel-props";
import {
  AdminEntityActionsSection,
  AdminEntityPanel as AdminEntityPanelLayout,
  AdminMembersSection,
} from "@rede-enois/design-system/domain";

import { adminEntitiesApi } from "@/lib/api/admin-entities";

import { adminMemberRows } from "./admin-members-view";

const PAGE_SIZE = 25;

/**
 * Bloco administrativo de uma comunidade ou de um grupo, dentro da própria página.
 *
 * Só é montado para quem `/moderation/me` devolve como admin — e mesmo assim cada chamada passa
 * por `/admin/moderation/**`, que o backend recusa para qualquer outro papel, inclusive com a
 * requisição montada à mão. A tela nunca decide permissão: mostra o que a API deixou.
 */
export function AdminEntityPanel({
  kind,
  entityId,
  entityName,
  onGone,
}: {
  kind: AdminEntityKind;
  entityId: string;
  entityName: string;
  /**
   * Chamado depois que o backend confirmou: `DELETED` só na exclusão física; `CLOSED` quando o
   * grupo foi encerrado com o conteúdo preservado.
   */
  onGone: (outcome: AdminEntityOutcome) => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);

  const labels = kind === "community" ? texts.communities.admin : texts.groups.admin;
  // Só o grupo tem "encerrar": a comunidade não tem esse desfecho, e o tipo de `labels` é a união
  // dos dois — sem a guarda, a chave que só existe em um deles some no TypeScript.
  const closeError =
    kind === "group"
      ? (failure: Error) => setError(failure.message || texts.groups.admin.closeError)
      : undefined;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["communities"] });
    void queryClient.invalidateQueries({ queryKey: ["community"] });
    void queryClient.invalidateQueries({ queryKey: ["groups"] });
    void queryClient.invalidateQueries({ queryKey: ["group"] });
  };

  const deletion = useMutation({
    mutationFn: (reason: string) =>
      kind === "community"
        ? adminEntitiesApi.deleteCommunity(entityId, reason)
        : adminEntitiesApi.deleteGroup(entityId, reason),
    onSuccess: () => {
      setError(null);
      refresh();
      onGone("DELETED");
    },
    onError: (failure: Error) => setError(failure.message || labels.deleteError),
  });

  const closing = useMutation({
    mutationFn: (reason: string) => adminEntitiesApi.closeGroup(entityId, reason),
    onSuccess: () => {
      setError(null);
      refresh();
      onGone("CLOSED");
    },
    onError: closeError,
  });

  return (
    <AdminEntityPanelLayout
      actions={
        <AdminEntityActionsSection
          kind={kind}
          entityName={entityName}
          title={labels.title}
          deleteLabel={labels.delete}
          description={labels.description}
          deleting={deletion.isPending}
          closing={closing.isPending}
          error={error}
          onDelete={async (reason) => {
            try {
              await deletion.mutateAsync(reason);
              return true;
            } catch {
              return false;
            }
          }}
          onClose={
            kind === "group"
              ? async (reason) => {
                  try {
                    await closing.mutateAsync(reason);
                    return true;
                  } catch {
                    return false;
                  }
                }
              : undefined
          }
        />
      }
      membersCollapsed={!membersOpen}
      membersLabel={labels.open}
      onOpenMembers={() => setMembersOpen(true)}
      members={
        <AdminMembersList
          kind={kind}
          entityId={entityId}
          entityName={entityName}
          onClose={() => setMembersOpen(false)}
        />
      }
    />
  );
}

/**
 * Lista completa de membros com busca e páginas, mais a remoção de uma pessoa.
 *
 * O motivo de uma remoção avulsa na tela é fixo e diz exatamente de onde veio a decisão; ele vai
 * para a auditoria junto com o admin responsável e o alvo.
 */
function AdminMembersList({
  kind,
  entityId,
  entityName,
  onClose,
}: {
  kind: AdminEntityKind;
  entityId: string;
  entityName: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const labels = kind === "community" ? texts.communities.admin : texts.groups.admin;

  const members = useQuery({
    queryKey: ["admin-entity-members", kind, entityId, query, page],
    queryFn: () =>
      kind === "community"
        ? adminEntitiesApi.communityMembers(entityId, query, page, PAGE_SIZE)
        : adminEntitiesApi.groupMembers(entityId, query, page, PAGE_SIZE),
  });

  const removal = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      kind === "community"
        ? adminEntitiesApi.removeCommunityMember(entityId, userId, reason)
        : adminEntitiesApi.removeGroupMember(entityId, userId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-entity-members", kind, entityId] });
      // A página por trás do painel mostra a contagem de membros; ela muda com a remoção.
      void queryClient.invalidateQueries({ queryKey: ["community", entityId] });
      void queryClient.invalidateQueries({ queryKey: ["group", entityId] });
      void queryClient.invalidateQueries({ queryKey: ["group-members", entityId] });
    },
  });

  return (
    <AdminMembersSection
      entityName={entityName}
      items={adminMemberRows(members.data, labels.roles)}
      total={members.data?.total ?? 0}
      page={members.data?.page ?? page}
      pages={members.data?.pages ?? 0}
      loading={members.isLoading}
      error={members.isError}
      query={query}
      onQuery={(next) => {
        setQuery(next);
        setPage(0);
      }}
      onPage={setPage}
      pending={removal.isPending}
      onRemove={async (userId) => {
        try {
          await removal.mutateAsync({ userId, reason: removalReason(kind) });
          return true;
        } catch {
          return false;
        }
      }}
      onClose={onClose}
    />
  );
}

function removalReason(kind: AdminEntityKind): string {
  return kind === "community"
    ? "Remoção administrativa da comunidade pela administração da plataforma."
    : "Remoção administrativa do grupo pela administração da plataforma.";
}
