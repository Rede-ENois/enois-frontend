import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { LinkedInSyncPrompt as LinkedInSyncPromptView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { linkedInIntegrationApi } from "@/lib/api";

const PENDING_KEY = "linkedin_link_pending";

/**
 * Pergunta feita UMA vez, ao voltar do vínculo com o LinkedIn: quer publicar seus posts do Énóis
 * também no feed do LinkedIn? A escolha é persistida no servidor (PUT /me/integrations/linkedin) e
 * pode ser mudada depois em Contas vinculadas.
 *
 * O link inicia em linked-accounts-dialog, que grava a flag; o callback do OAuth cai no /feed, onde
 * este componente mora. Se o servidor ainda não consegue publicar (sem chave de criptografia ou
 * token sem w_member_social), o diálogo explica em vez de oferecer um "Sim" que não funciona.
 */
export function LinkedInSyncPrompt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(localStorage.getItem(PENDING_KEY) === "1");
  }, []);

  const { data: status } = useQuery({
    queryKey: ["linkedin-integration"],
    queryFn: () => linkedInIntegrationApi.status(),
    enabled: pending,
  });

  const setSync = useMutation({
    mutationFn: (enabled: boolean) => linkedInIntegrationApi.setPostSync(enabled),
    onSuccess: (result) => {
      queryClient.setQueryData(["linkedin-integration"], result);
      close();
    },
    onError: () => {
      toast(texts.auth.links.linkedinSync.unavailable, "error");
      close();
    },
  });

  const close = () => {
    localStorage.removeItem(PENDING_KEY);
    setPending(false);
  };

  // Sem conexão (o vínculo não completou): não há o que perguntar.
  useEffect(() => {
    if (pending && status && !status.connected) {
      close();
    }
  }, [pending, status]);

  if (!pending || !status || !status.connected) return null;

  return (
    <LinkedInSyncPromptView
      notReady={!status.canPost}
      serverKeyMissing={status.reason === "SERVER_KEY_MISSING"}
      pending={setSync.isPending}
      onClose={close}
      onAnswer={(enabled) => setSync.mutate(enabled)}
    />
  );
}
