import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { TermometroPeriodo } from "@rede-enois/design-system/domain";
import { TermometroPanel } from "@rede-enois/design-system/domain";
import { PageHeader } from "@rede-enois/design-system/ui";

import { termometroApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

/**
 * O Termômetro: o painel do clima coletivo do Explorar. O sistema mede o que a comunidade já
 * publicou (Desabafos e Confessionário) e conta o conjunto: porcentagens por emoção, pessoas
 * distintas, evolução entre janelas. Ninguém responde nada aqui — é medido, não perguntado —
 * e não existe nome na conta: só porcentagem do conjunto, com amostra mínima para o indicador
 * aparecer. O desenho vive no design system; aqui ficam os dados.
 */
export const Route = createFileRoute("/termometro")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.termometro.seoTitle }] }),
  component: TermometroPage,
});

function TermometroPage() {
  const [periodo, setPeriodo] = useState<TermometroPeriodo>("HOJE");

  const painel = useQuery({
    queryKey: ["termometro"],
    queryFn: termometroApi.painel,
    // O clima é medido por corte periódico do servidor; não precisa acompanhar em tempo real.
    staleTime: 60_000,
  });

  const estado = painel.isLoading
    ? ("loading" as const)
    : painel.isError
      ? ("error" as const)
      : ("ready" as const);

  return (
    <AppContainer>
      <PageHeader title={texts.termometro.title} description={texts.termometro.subtitle} />
      <TermometroPanel
        janelas={painel.data ?? null}
        estado={estado}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
        onRetry={() => void painel.refetch()}
      />
    </AppContainer>
  );
}
