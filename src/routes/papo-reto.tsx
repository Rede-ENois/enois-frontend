import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { PapoJanela, PapoStatus } from "@rede-enois/design-system/domain";
import { PapoPanel } from "@rede-enois/design-system/domain";
import { PageHeader } from "@rede-enois/design-system/ui";

import { papoRetoApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

/**
 * O Papo Reto: os assuntos que nomeiam a conversa da rede. O sistema mede o que já é público
 * (posts e comentários do feed) e conta as expressões do conjunto: status de trajetória,
 * pessoas distintas, publicações, comentários e a timeline por hora. Ninguém responde nada
 * aqui, e não existe autor em lugar nenhum porque o backend não manda. O desenho vive no
 * design system; aqui ficam os dados — o ranking vem inteiro numa requisição, o filtro de
 * trajetória é da tela, e a timeline chega quando o assunto abre.
 */
export const Route = createFileRoute("/papo-reto")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.papoReto.seoTitle }] }),
  component: PapoRetoPage,
});

function PapoRetoPage() {
  const [filtro, setFiltro] = useState<PapoStatus | null>(null);
  const [subjectAberto, setSubjectAberto] = useState<string | null>(null);
  const [janela, setJanela] = useState<PapoJanela>("24h");

  const ranking = useQuery({
    queryKey: ["papo-reto"],
    queryFn: papoRetoApi.ranking,
    // O ranking é medido por corte periódico do servidor (a cada 5 minutos); não acompanha ao vivo.
    staleTime: 60_000,
  });

  const analise = useQuery({
    queryKey: ["papo-reto-analise"],
    queryFn: papoRetoApi.analise,
    staleTime: 60_000,
  });

  const timeline = useQuery({
    queryKey: ["papo-reto-timeline", subjectAberto, janela],
    queryFn: () => papoRetoApi.timeline(subjectAberto ?? "", janela),
    enabled: subjectAberto !== null,
    // O mesmo bucket volta sempre ao mesmo número; a janela trocada é uma busca nova.
    staleTime: 60_000,
  });

  const publicacoes = useQuery({
    queryKey: ["papo-reto-publicacoes", subjectAberto, janela],
    queryFn: () => papoRetoApi.publicacoes(subjectAberto ?? "", janela),
    enabled: subjectAberto !== null,
    // A publicação que falou do assunto não muda de minuto a minuto; o corte é periódico.
    staleTime: 60_000,
  });

  const estado = ranking.isLoading
    ? ("loading" as const)
    : ranking.isError
      ? ("error" as const)
      : ("ready" as const);

  const publicacoesEstado = publicacoes.isLoading
    ? ("loading" as const)
    : publicacoes.isError
      ? ("error" as const)
      : ("ready" as const);

  return (
    <AppContainer>
      <PageHeader title={texts.papoReto.title} description={texts.papoReto.subtitle} />
      <PapoPanel
        assuntos={ranking.data ?? null}
        estado={estado}
        falasAnalisadas={analise.isError ? null : (analise.data ?? null)}
        filtro={filtro}
        onFiltroChange={setFiltro}
        subjectAberto={subjectAberto}
        onSubjectChange={setSubjectAberto}
        timeline={subjectAberto !== null ? (timeline.data ?? null) : null}
        janela={janela}
        onJanelaChange={setJanela}
        publicacoes={subjectAberto !== null ? (publicacoes.data ?? null) : null}
        publicacoesEstado={publicacoesEstado}
        onPublicacoesRetry={() => {
          void publicacoes.refetch();
        }}
        onRetry={() => {
          void ranking.refetch();
          void analise.refetch();
        }}
      />
    </AppContainer>
  );
}
