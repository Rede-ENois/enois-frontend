import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { DeveloperOriginsSection as DeveloperOriginsSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { developerOriginsApi } from "@/lib/api";
import { useIsAuthenticated } from "@/lib/use-auth";

/**
 * Cadastro da origem que pode consumir a API pública pelo navegador. Sem ela, o preflight de
 * /v1 responde 403 e o CORS não libera a leitura da resposta.
 */
export function DeveloperOriginsSection() {
  const authenticated = useIsAuthenticated();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery({
    queryKey: ["developer-origins"],
    queryFn: () => developerOriginsApi.list(),
    enabled: authenticated,
    retry: false,
  });

  const add = useMutation({
    mutationFn: (origin: string) => developerOriginsApi.add(origin.trim()),
    onSuccess: () => {
      toast(texts.developers.originAdded, "success");
      void queryClient.invalidateQueries({ queryKey: ["developer-origins"] });
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.developers.originError, "error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => developerOriginsApi.remove(id),
    onSuccess: () => {
      toast(texts.developers.originRemoved, "success");
      void queryClient.invalidateQueries({ queryKey: ["developer-origins"] });
    },
    onError: () => toast(texts.developers.originError, "error"),
  });

  return (
    <DeveloperOriginsSectionView
      authenticated={authenticated}
      loginHref="/entrar"
      loading={isLoading}
      origins={data}
      addPending={add.isPending}
      onAdd={(origin) =>
        add.mutateAsync(origin).then(
          () => true,
          () => false,
        )
      }
      removePending={remove.isPending}
      onRemove={(id) => remove.mutate(id)}
    />
  );
}
