import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { GroupAdmin } from "@/types/application/message/group-admin";
import type { GroupPanelView } from "@/types/application/message/group-panel-view";
import type { Message } from "@/types/application/message/message";
import type { NetworkUser } from "@/types/application/network/network-user";
import type {
  GroupAdminCandidate,
  GroupAdminParticipantData,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { messagesApi, networkApi } from "@/lib/api";
import { historyKeysFor } from "@/lib/e2e/conversation";
import { getAllPrivateKeys } from "@/lib/e2e/key-manager";
import { useDebouncedValue } from "@/lib/use-debounced-value";

/** Teto de páginas lidas para a concessão: o histórico inteiro de um grupo grande vira cisão. */
const HISTORY_PAGES = 20;

/**
 * Concessão de histórico na entrada no grupo: cada mensagem antiga vai com a chave já cifrada
 * para a chave pública de quem entrou. Falhar aqui não desfaz a entrada — a pessoa continua no
 * grupo, só pede a chave a alguém depois.
 */
async function grantHistory(
  conversationId: string,
  currentUserId: string,
  userId: string,
): Promise<boolean> {
  try {
    // Sem chave local não há o que abrir para recifrar: nem gasta as leituras.
    if ((await getAllPrivateKeys()).length === 0) return false;
    const messages: Message[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < HISTORY_PAGES && (page === 0 || cursor); page += 1) {
      const next = await messagesApi.listMessages(conversationId, cursor, 200);
      messages.push(...next.items);
      cursor = next.nextCursor ?? null;
    }
    const keys = await historyKeysFor(messages, currentUserId, userId);
    if (Object.keys(keys).length === 0) return false;
    await messagesApi.grantHistoryKeys(conversationId, userId, keys);
    return true;
  } catch {
    return false;
  }
}

/**
 * O painel do grupo de uma conversa: quem participa, quem ainda pode entrar (contatos fora do
 * grupo) e as ações de dono e administrador. A tela recebe os dados e as funções; a rede mora
 * aqui, com o cache do react-query por conversa.
 */
export function useGroupAdmin(
  conversationId: string,
  currentUserId: string | null,
  enabled: boolean,
): GroupAdmin {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [error, setError] = useState<string | null>(null);

  const panelQuery = useQuery({
    queryKey: ["group-panel", conversationId],
    queryFn: () => messagesApi.groupPanel(conversationId),
    enabled,
  });
  const panel = panelQuery.data;

  const candidatesQuery = useQuery({
    queryKey: ["group-candidates", conversationId, debouncedSearch],
    queryFn: async (): Promise<GroupAdminCandidate[]> => {
      const members = new Set(panel?.participants.map((participant) => participant.userId) ?? []);
      const { items } = await networkApi.list(debouncedSearch);
      return items
        .filter((user: NetworkUser) => user.id !== currentUserId)
        .map((user) => ({
          id: user.id,
          name: user.name || `@${user.username}`,
          avatar: user.avatar,
          alreadyMember: members.has(user.id),
        }));
    },
    enabled: enabled && debouncedSearch.length > 0,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["group-panel", conversationId] });
    void queryClient.invalidateQueries({ queryKey: ["group-candidates", conversationId] });
    void queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
  };

  const groupParticipants = panel?.participants ?? [];

  // O painel devolve nome nulo para quem não tem perfil: a linha do DS precisa de um nome.
  const participants: GroupAdminParticipantData[] = groupParticipants.map((participant) => ({
    userId: participant.userId,
    name:
      participant.name ??
      (participant.username ? `@${participant.username}` : texts.messages.group.unknownName),
    nameStyle: participant.nameStyle,
    avatar: participant.avatar,
    role: participant.role,
  }));

  const nameOf = (userId: string) =>
    groupParticipants.find((participant) => participant.userId === userId)?.name ??
    candidatesQuery.data?.find((candidate) => candidate.id === userId)?.name ??
    texts.messages.group.unknownName;

  const add = useMutation({
    mutationFn: async (userIds: string[]) => {
      const historyGranted: boolean[] = [];
      for (const userId of userIds) {
        await messagesApi.addParticipant(conversationId, userId);
        if (currentUserId) {
          historyGranted.push(await grantHistory(conversationId, currentUserId, userId));
        }
      }
      return { userIds, historyGranted };
    },
    onSuccess: ({ userIds, historyGranted }) => {
      refresh();
      toast(texts.messages.group.added(nameOf(userIds[0])));
      if (historyGranted.some((granted) => !granted)) {
        toast(texts.messages.group.historyFailed, "error");
      }
    },
    onError: () => setError(texts.messages.group.addError),
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "ADMIN" | "MEMBER" }) =>
      messagesApi.changeParticipantRole(conversationId, userId, role),
    onSuccess: (_data, { role }) => {
      refresh();
      toast(role === "ADMIN" ? texts.messages.group.promoteDone : texts.messages.group.demoteDone);
    },
    onError: () => setError(texts.messages.group.roleError),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => messagesApi.removeParticipant(conversationId, userId),
    onSuccess: (_data, userId) => {
      refresh();
      toast(texts.messages.group.removed(nameOf(userId)));
    },
    onError: () => setError(texts.messages.group.removeError),
  });

  const myRole = panel?.myRole ?? null;

  return {
    panel,
    participants,
    loading: panelQuery.isLoading,
    myRole,
    canManage: myRole === "OWNER" || myRole === "ADMIN",
    isOwner: myRole === "OWNER",
    candidates: candidatesQuery.data ?? [],
    candidatesLoading: candidatesQuery.isFetching,
    pending: add.isPending || changeRole.isPending || remove.isPending,
    error,
    onSearchCandidates: setSearch,
    onAddMembers: async (userIds: string[]) => {
      setError(null);
      await add.mutateAsync(userIds).catch(() => undefined);
    },
    onPromote: async (userId: string) => {
      setError(null);
      await changeRole.mutateAsync({ userId, role: "ADMIN" }).catch(() => undefined);
    },
    onDemote: async (userId: string) => {
      setError(null);
      await changeRole.mutateAsync({ userId, role: "MEMBER" }).catch(() => undefined);
    },
    onRemove: async (userId: string) => {
      setError(null);
      await remove.mutateAsync(userId).catch(() => undefined);
    },
  };
}
