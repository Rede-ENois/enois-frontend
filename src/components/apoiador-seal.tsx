import { useQuery } from "@tanstack/react-query";

import { HeartHandshake } from "lucide-react";

import { doacoesApi } from "@/lib/api";

/**
 * Selo de apoiador no perfil: a pessoa tem pelo menos uma doação confirmada. Só o booleano vem do
 * servidor — valor e data de doação são privados, e o perfil não recebe nenhum dos dois.
 */
export function ApoiadorSeal({ username }: { username: string }) {
  const { data } = useQuery({
    queryKey: ["apoiador-seal", username],
    queryFn: () => doacoesApi.apoiador(username),
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (!data?.apoiador) return null;

  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary">
      <HeartHandshake className="h-4 w-4" aria-hidden />
      Apoiador
    </p>
  );
}
