import { type FormEvent, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { messagesApi } from "@/lib/api";
import type { Conversation } from "@/lib/api";
import { sortByTime } from "@/utils/messages";

export function useMessageThreadState(conversation: Conversation | null) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: () => messagesApi.listMessages(conversation!.id),
    enabled: Boolean(conversation),
    refetchInterval: 10_000,
  });
  const sendMessage = useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      messagesApi.sendMessage(conversationId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setText("");
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || !conversation) return;
    sendMessage.mutate({ conversationId: conversation.id, message });
  };

  return {
    messages: sortByTime(data?.items ?? []),
    text,
    setText,
    sending: sendMessage.isPending,
    submit,
  };
}
