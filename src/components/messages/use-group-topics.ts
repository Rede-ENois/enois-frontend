import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { GroupTopics } from "@/types/application/message/group-topics";
import { type GroupTopicError, groupTopicErrorFromServer } from "@rede-enois/design-system/domain";

import { messagesApi } from "@/lib/api";
import { apiErrorCode } from "@/lib/api-error-code";

/** O erro de gestão como o DS o mostra: ao lado da ação, na língua da pessoa. */
function errorText(code: GroupTopicError | null): string {
  const errors = texts.messages.groupTopics.errors;
  if (code === "ALREADY_EXISTS") return errors.nameTaken;
  if (code === "INVALID_NAME") return errors.invalidName;
  if (code === "TOO_MANY") return errors.tooManyTopics;
  if (code === "FORBIDDEN") return errors.notManager;
  return errors.generic;
}

/**
 * Os tópicos do grupo de uma conversa. Só a conversa `GROUP` pede a lista; tópicos arquivados
 * não filtram a conversa, então ficam de fora do filtro que o view recebe.
 */
export function useGroupTopics(conversationId: string, enabled: boolean): GroupTopics {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["group-topics", conversationId],
    queryFn: () => messagesApi.listGroupTopics(conversationId),
    enabled,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["group-topics", conversationId] });

  // Cada ação devolve o código de erro (ou `null`) e o filão mostra a mensagem do `error`
  // logo abaixo da fileira; o painel de gestão traduz o mesmo código para a linha dele.
  const run = async (action: () => Promise<unknown>): Promise<GroupTopicError | null> => {
    setFailure(null);
    try {
      await action();
      await refresh();
      return null;
    } catch (error) {
      const code = groupTopicErrorFromServer(apiErrorCode(error));
      setFailure(errorText(code));
      return code;
    }
  };

  const create = useMutation({
    mutationFn: (name: string) => messagesApi.createGroupTopic(conversationId, name),
  });
  const rename = useMutation({
    mutationFn: ({ topicId, name }: { topicId: string; name: string }) =>
      messagesApi.renameGroupTopic(conversationId, topicId, name),
  });
  const archive = useMutation({
    mutationFn: (topicId: string) => messagesApi.archiveGroupTopic(conversationId, topicId),
  });
  const reorder = useMutation({
    mutationFn: (topicIds: string[]) => messagesApi.reorderGroupTopics(conversationId, topicIds),
  });

  return {
    error: failure,
    topics: (query.data?.items ?? []).map((topic) => ({
      id: topic.id,
      name: topic.name,
      status: topic.status,
    })),
    loading: query.isLoading,
    pending: create.isPending || rename.isPending || archive.isPending || reorder.isPending,
    onCreateTopic: (name: string) => run(() => create.mutateAsync(name)),
    onRenameTopic: (topicId: string, name: string) =>
      run(() => rename.mutateAsync({ topicId, name })),
    onArchiveTopic: (topicId: string) => run(() => archive.mutateAsync(topicId)),
    onReorderTopics: (topicIds: string[]) => run(() => reorder.mutateAsync(topicIds)),
  };
}
