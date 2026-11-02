import { useQuery } from "@tanstack/react-query";

import type { AdminNotice } from "@/types/application/notices/admin-notice";

import { noticesApi } from "@/lib/api";

/**
 * O aviso da plataforma escrito por um admin, no dois formatos: faixa embaixo do cabecalho e popup.
 *
 * O HTML entra sempre pelo `SandboxedHtmlFrame` — e o mesmo quadro do post de pagina, sem
 * `allow-scripts`. Nao ha atalho aqui: o conteudo vem do painel de admin, e painel confiavel nao e
 * fonte de HTML confiavel.
 */
export function useAdminNotice(): AdminNotice | null {
  const { data } = useQuery({
    queryKey: ["avisos", "ativo"],
    queryFn: () => noticesApi.current(),
    // O aviso e raro e muda por publicacao, nao por tempo: uma leitura por visita basta.
    staleTime: 5 * 60_000,
    retry: false,
  });

  return data ?? null;
}
