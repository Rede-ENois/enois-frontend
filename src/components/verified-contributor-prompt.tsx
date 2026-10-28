import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { VerifiedContributorPromptProps } from "@/types/components/verified-contributor-prompt-props";
import { VerifiedContributorPrompt as VerifiedContributorPromptView } from "@rede-enois/design-system/domain";

import { contributorsApi } from "@/lib/api";
import { useIsAuthenticated } from "@/lib/use-auth";

import { ContributionForm } from "./contribution-form";

/**
 * Convite para quem já tem contribuição verificada confirmar os dados no painel de contribuintes.
 * O formulário é o mesmo da landing; a diferença é que a aprovação já veio do GitHub — não há
 * triagem manual. Fica colapsado por padrão.
 */
export function VerifiedContributorPrompt({
  showConfirmed = false,
}: VerifiedContributorPromptProps) {
  const authenticated = useIsAuthenticated();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["contributors", "me"],
    queryFn: () => contributorsApi.me(),
    enabled: authenticated,
    retry: false,
    staleTime: 60_000,
  });

  if (!authenticated || !data?.verified) return null;

  // Quem já confirmou não vê o formulário de novo; na página de selos mostramos o estado para a
  // ausência do convite não parecer falha.
  if (!data.applicationPending && !showConfirmed) return null;

  return (
    <VerifiedContributorPromptView
      confirmed={!data.applicationPending}
      form={
        <ContributionForm
          mode="verified"
          initial={{
            name: data.name ?? "",
            email: data.email ?? "",
            github: data.github ?? "",
          }}
          onSuccess={() => void queryClient.invalidateQueries({ queryKey: ["contributors", "me"] })}
        />
      }
    />
  );
}
