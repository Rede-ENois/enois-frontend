import { type FormEvent, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { messageApi } from "@/lib/api";
import type { Conversation } from "@/lib/api";
import { sortMessagesByTime } from "@/utils/messages";

export function useMessageThreadState(conversation: Conversation | null) {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");

  const { data: messagesData } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: () => messageApi.listMessages(conversation!.id),
    enabled: Boolean(conversation),
    refetchInterval: 10_000,
  });
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      messageApi.sendMessage(conversationId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setMessageText("");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !conversation) return;
    sendMessageMutation.mutate({ conversationId: conversation.id, text });
  };

  return {
    messages: sortMessagesByTime(messagesData?.items ?? []),
    messageText,
    setMessageText,
    isSending: sendMessageMutation.isPending,
    handleSubmit,
  };
}
