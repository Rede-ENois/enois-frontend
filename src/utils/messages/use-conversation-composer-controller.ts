import { type FormEvent, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useMessagesStore } from "@/stores/messages/messages.store";

import { sendMessage } from "@/lib/messages/api/send-message";

export function useConversationComposerController() {
  const queryClient = useQueryClient();
  const conversationId = useMessagesStore((state) => state.activeConversationId);
  const [text, setText] = useState("");

  const send = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => sendMessage(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setText("");
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = text.trim();
    if (!conversationId || !content) return;
    send.mutate({ id: conversationId, content });
  };

  return {
    text,
    setText,
    submit,
    sending: send.isPending,
    submitDisabled: !conversationId || !text.trim() || send.isPending,
  };
}
