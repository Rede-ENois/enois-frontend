import { useQuery } from "@tanstack/react-query";

import { moderationApi } from "@/lib/api";

/**
 * "Esta sessão é administradora da plataforma?" — a pergunta que decide se os controles
 * administrativos aparecem.
 *
 * A resposta vem do backend (`/moderation/me` → `admin`, lido de `users.is_admin`), nunca de um
 * cargo escolhido na tela. Ficar sem sessão, ou a chamada falhar, conta como "não é admin": a
 * tela não mostra o controle e cada rota `/admin/**` recusaria de qualquer forma.
 *
 * O cache é único para o app inteiro (um card por post, um por comentário) — quem chama várias
 * vezes não abre várias requisições.
 */
export function useIsPlatformAdmin(): boolean {
  const me = useQuery({
    queryKey: ["moderator", "me"],
    queryFn: () => moderationApi.me(),
    retry: false,
    staleTime: 60_000,
  });
  return me.data?.admin === true;
}
