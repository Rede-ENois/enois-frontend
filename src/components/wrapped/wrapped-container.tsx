import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { WrappedEstado } from "@rede-enois/design-system/domain";
import { WrappedExperience } from "@rede-enois/design-system/domain";

import { wrappedApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { WRAPPED_ANO, paraEstado, textoCompartilhado } from "@/lib/wrapped/wrapped-mapeamento";

/** A página do Wrapped: carrega a retrospectiva da própria sessão e compartilha o texto do card. */
export function WrappedContainer() {
  const user = useCurrentUser();
  const pronto = user.data != null;
  const consulta = useQuery({
    queryKey: ["wrapped", WRAPPED_ANO, pronto],
    queryFn: () => wrappedApi.retrospectiva(WRAPPED_ANO),
    enabled: pronto,
    staleTime: 5 * 60_000,
  });

  const estado: WrappedEstado = consulta.isError
    ? { kind: "error", message: mensagem(consulta.error) }
    : paraEstado(consulta.data);

  const nome = user.data?.name || user.data?.username || "";

  const compartilhar = () => {
    const texto = textoCompartilhado(estado.kind === "ready" ? estado.retrospectiva : null, nome);
    void compartilharTexto(texto);
  };

  return (
    <WrappedExperience
      state={estado}
      nome={nome}
      onRetry={() => void consulta.refetch()}
      onShare={compartilhar}
    />
  );
}

function mensagem(erro: unknown): string {
  return erro instanceof Error ? erro.message : texts.wrapped.subtitle;
}

async function compartilharTexto(texto: string) {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: texts.wrapped.shareTitle, text: texto, url: location.href });
      return;
    } catch {
      // A pessoa fechou o menu nativo: cai para a cópia, sem erro.
    }
  }
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    // Sem menu nativo e sem clipboard: a pessoa ainda pode copiar pela seleção do texto.
  }
}
