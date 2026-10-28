import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { PanicModeSection as PanicModeSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { moderationApi } from "@/lib/api";

/**
 * Botão de pânico: bloqueia TODA escrita da aplicação com 429 enquanto estiver ativo. O próprio
 * botão (e o login) ficam fora do bloqueio, senão não haveria como desligar. O estado é
 * compartilhado entre os pods pelo backend.
 */
export function PanicModeSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const status = useQuery({
    queryKey: ["moderation", "panic"],
    queryFn: () => moderationApi.panicStatus(),
    refetchInterval: 5_000,
  });

  const toggle = useMutation({
    mutationFn: (active: boolean) => moderationApi.setPanic(active),
    onSuccess: (result) => {
      queryClient.setQueryData(["moderation", "panic"], result);
      toast(texts.moderator.panic.done(result.active), "success");
    },
    onError: () => toast(texts.moderator.panic.error, "error"),
  });

  return (
    <PanicModeSectionView
      active={status.data?.active ?? false}
      envLocked={status.data?.envLocked ?? false}
      loading={status.isLoading}
      pending={toggle.isPending}
      onActivate={() => toggle.mutate(true)}
      onDeactivate={() => toggle.mutate(false)}
    />
  );
}
