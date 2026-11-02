import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { FreelanceView } from "@/types/application/freelance/freelance-view";
import { ApplyFreelanceDialog as ApplyFreelanceDialogView } from "@rede-enois/design-system/domain";

import { freelancesApi } from "@/lib/api";
import { useProfessionalIdentity } from "@/lib/use-professional-identity";

/**
 * Proposta para um freela: a mensagem de apresentação sai pela identidade profissional e cai na
 * conversa profissional com quem publicou (o servidor decide as duas coisas).
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

  const { applicant, professionalSetupHref } = useProfessionalIdentity();

  const send = useMutation({
    mutationFn: (message: string) => freelancesApi.propose(freelance.id, message),
    onSuccess: ({ conversationId }) => {
      setError(null);
      setSentConversation(conversationId);
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
      applicant={applicant}
      professionalSetupHref={professionalSetupHref}
      onOpenChat={() =>
        void navigate({
          to: "/mensagens",
          search: { conversation: sentConversation! },
        })
      }
    />
  );
}
