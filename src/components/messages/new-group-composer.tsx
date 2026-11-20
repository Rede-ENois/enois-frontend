import { Fragment, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GroupComposer } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { messagesApi, networkApi } from "@/lib/api";
import { conversationErrorMessage } from "@/lib/conversation-error";
import { useCurrentUser } from "@/lib/current-user";

/**
 * Aba "Novo grupo": título e seleção MÚLTIPLA de pessoas. A busca é a mesma lista de pessoas de
 * /rede; a trava contra o toque duplo é a do "abrir conversa" — um segundo toque no mesmo tick
 * criaria um grupo repetido, porque `isPending` só chega à tela no próximo render.
 */
export function NewGroupComposer({ onCreated }: { onCreated: (conversationId: string) => void }) {
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // Enquanto ninguém digitou, o seletor abre vazio em vez de despejar a rede inteira.
  const [query, setQuery] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", query],
    queryFn: () => networkApi.list(query),
    enabled: query.length > 0,
  });
  const contacts = (searchResults?.items ?? []).filter((u) => u.id !== currentUserId);

  const creatingRef = useRef(false);
  const createGroup = useMutation({
    mutationFn: ({ title, participantIds }: { title: string; participantIds: string[] }) =>
      messagesApi.createConversation({ kind: "GROUP", title, participantIds }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onCreated(conv.id);
    },
    onError: (err) => toast(conversationErrorMessage(err), "error"),
  });

  return (
    <Fragment>
      <GroupComposer
        contacts={(query ? contacts : []).map((u) => ({
          id: u.id,
          name: u.name,
          headline: u.headline,
          avatar: u.avatar,
        }))}
        onSearch={setQuery}
        pending={createGroup.isPending}
        onCreate={(groupTitle, participantIds) => {
          if (creatingRef.current) return;
          creatingRef.current = true;
          createGroup.mutate(
            { title: groupTitle, participantIds },
            {
              onSettled: () => {
                creatingRef.current = false;
              },
            },
          );
        }}
      />
    </Fragment>
  );
}
