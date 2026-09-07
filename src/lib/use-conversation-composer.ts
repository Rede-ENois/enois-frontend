import { type FormEvent, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sendMessage } from "@/lib/api/messages/send-message";

export function useConversationComposer(conversationId: string) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const send = useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setText("");
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = text.trim();
    if (!content) return;
    send.mutate(content);
  };

  return { text, setText, submit, sending: send.isPending };
}
