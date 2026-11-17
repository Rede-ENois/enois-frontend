import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { NetworkJoinDialogData } from "@/types/application/network/network-join-dialog-data";
import type { NetworkJoinToken } from "@/types/application/network/network-join-token";
import type { NetworkJoinDialogProps } from "@rede-enois/design-system/domain";
import { NetworkJoinDialog as NetworkJoinDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, networkParticipantApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

const NODES_KEY = ["network", "participant", "nodes"];

/**
 * O diálogo de ingresso na rede: o participante declara o servidor, recebe o token de uso único
 * (mostrado uma única vez) e a lista "Meus servidores" recarrega com o novo pedido pendente.
 * O `open` vem da página: enquanto houver token emitido, o diálogo não fecha por fora.
 */
export function NetworkJoinSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [issued, setIssued] = useState<NetworkJoinToken | null>(null);

  const join = useMutation({
    mutationFn: (displayName: string) => networkParticipantApi.requestJoin(displayName),
    onSuccess: (token) => {
      setIssued(token);
      toast(texts.moderator.network.joinRequested, "success");
      void queryClient.invalidateQueries({ queryKey: NODES_KEY });
    },
    onError: () => setIssued(null),
  });

  const viewProps: NetworkJoinDialogProps = {
    open: open || issued != null,
    onOpenChange: (next) => {
      if (!next) setIssued(null);
      onOpenChange(next);
      join.reset();
    },
    onRequestJoin: (displayName) => join.mutate(displayName),
    joinPending: join.isPending,
    issuedToken: issued ? dialogToken(issued) : null,
    onDismissToken: () => setIssued(null),
    joinError: join.isError ? texts.moderator.network.actionError : null,
  };

  return <NetworkJoinDialogView {...viewProps} />;
}

/** O token emitido na forma que a view do design system espera (validade já formatada). */
function dialogToken(token: NetworkJoinToken): NetworkJoinDialogData {
  return {
    token: token.token,
    expiresAtLabel: dataHora(token.expiresAt),
    nextStep: token.nextStep,
  };
}
