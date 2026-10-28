import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { FreelanceView } from "@/types/application/freelance/freelance-view";
import { ApplyFreelanceDialog as ApplyFreelanceDialogView } from "@rede-enois/design-system/domain";

import { messagesApi } from "@/lib/api";

/**
 * Candidatura a um freela: não existe formulário — abre (ou reaproveita) a conversa direta com quem
 * publicou e manda a mensagem de apresentação, que é onde escopo, prazo e valor são combinados.
 */
export function ApplyFreelanceDialog({
  freelance,
  open,
  onOpenChange,
}: {
  freelance: FreelanceView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [sentConversation, setSentConversation] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: async (message: string) => {
      const conversation = await messagesApi.openDirect(freelance.userId);
      await messagesApi.sendMessage(conversation.id, message);
      return conversation;
    },
    onSuccess: (conversation) => {
      setError(null);
      setSentConversation(conversation.id);
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : texts.jobs.freelancePage.applyError),
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setError(null);
      setSentConversation(null);
      send.reset();
    }
    onOpenChange(next);
  };

  return (
    <ApplyFreelanceDialogView
      freelance={freelance}
      open={open}
      onOpenChange={handleOpenChange}
      pending={send.isPending}
      error={error}
      sent={sentConversation !== null}
      onSend={(message) => send.mutate(message)}
      onOpenChat={() =>
        void navigate({
          to: "/mensagens",
          search: { conversation: sentConversation! },
        })
      }
    />
  );
}
