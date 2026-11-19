import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { DesafioParticipacaoView } from "@/types/application/desafios/desafio-participacao-view";
import type { DesafioView } from "@/types/application/desafios/desafio-view";
import {
  DesafiosCard,
  DesafiosComposer,
  DesafiosFeed,
  DesafiosParticipacoes,
} from "@rede-enois/design-system/domain";
import type {
  DesafioView as DesafioCardView,
  DesafioParticipacaoView as DesafioMuralView,
  DesafiosFeedState,
  DesafiosParticipacoesState,
} from "@rede-enois/design-system/domain";
import { PageHeader, useToast } from "@rede-enois/design-system/ui";
import { z } from "zod";

import { desafiosApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { ReportDialog } from "@/components/post/report-dialog";

/**
 * Desafios: convites nominais do Explorar — alguém convoca, a comunidade responde no mural e
 * quem convocou encerra reconhecendo UMA participação. Sem ranking e sem prêmio. Espaço só
 * dele: nada aparece no feed Tudo, no perfil ou na busca. O desenho (compositor, linha do
 * tempo, cards e mural) vive no design system; aqui ficam os dados.
 */
const searchSchema = z.object({
  /** Deep link de notificação: abre o mural do desafio avisado direto. */
  desafio: z.string().optional(),
});

export const Route = createFileRoute("/desafios")({
  beforeLoad: requireAuth,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: texts.desafios.seoTitle }] }),
  component: DesafiosPage,
});

function DesafiosPage() {
  const { desafio: desafioAvisado } = Route.useSearch();
  const navigate = useNavigate();
  // Só UM mural aberto por vez; a URL guarda qual, para o aviso reabrir o mesmo desafio.
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    if (desafioAvisado) {
      setAberto(desafioAvisado);
    }
  }, [desafioAvisado]);

  const feed = useInfiniteQuery({
    queryKey: ["desafios"],
    queryFn: ({ pageParam }) => desafiosApi.feed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const desafios = feed.data?.pages.flatMap((page) => page.items).map(paraCard) ?? [];
  const estado: DesafiosFeedState = feed.isLoading
    ? { kind: "loading" }
    : feed.isError
      ? { kind: "error" }
      : desafios.length === 0
        ? { kind: "empty" }
        : { kind: "ready" };

  const abrir = (desafioId: string | null) => {
    setAberto(desafioId);
    void navigate({ to: "/desafios", search: { desafio: desafioId ?? undefined } });
  };

  return (
    <AppContainer>
      <PageHeader title={texts.desafios.title} description={texts.desafios.subtitle} />
      <DesafiosPublicacao />
      <DesafiosFeed
        desafios={desafios}
        state={estado}
        hasMore={feed.hasNextPage}
        loadingMore={feed.isFetchingNextPage}
        onLoadMore={() => void feed.fetchNextPage()}
        renderCard={(desafio) => (
          <DesafioCardAberta
            key={desafio.id}
            desafio={desafio}
            aberto={aberto === desafio.id}
            onAbrir={abrir}
          />
        )}
      />
    </AppContainer>
  );
}

/** O compositor dos Desafios: o app publica e avisa; o DS desenha os campos e o prazo. */
function DesafiosPublicacao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publicar = useMutation({
    mutationFn: (entrada: { title: string; description: string; endsAt?: string }) =>
      desafiosApi.publish(entrada),
    onSuccess: () => {
      toast(texts.desafios.publishSuccess, "success");
      void queryClient.invalidateQueries({ queryKey: ["desafios"] });
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "RATE_LIMITED" || codigo === "TOO_MANY_REQUESTS") {
        toast(texts.desafios.rateLimitError, "error");
      } else if (codigo === "RESTRICTED" || codigo === "SANCTIONED") {
        toast(texts.desafios.restrictedError, "error");
      } else if (codigo === "TITLE_TOO_LONG") {
        toast(texts.desafios.titleTooLongError, "error");
      } else if (codigo === "DESCRIPTION_TOO_LONG") {
        toast(texts.desafios.descriptionTooLongError, "error");
      } else if (codigo === "ENDS_AT_PAST" || codigo === "ENDS_AT_TOO_FAR") {
        toast(texts.desafios.deadlineInvalidError, "error");
      } else {
        toast(texts.desafios.publishError, "error");
      }
    },
  });

  return (
    <DesafiosComposer
      onPublish={async (entrada) => {
        await publicar.mutateAsync(entrada);
      }}
    />
  );
}

/**
 * O card de um desafio: quando aberto, o mural de participações desenha logo abaixo — o
 * desafio do aviso abre sozinho. Remover (e a denúncia de quem vê) fica no card; encerrar com
 * reconhecimento mora no mural.
 */
function DesafioCardAberta({
  desafio,
  aberto,
  onAbrir,
}: {
  desafio: DesafioCardView;
  aberto: boolean;
  onAbrir: (desafioId: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [denuncia, setDenuncia] = useState(false);

  const mural = useQuery({
    queryKey: ["desafios-participacoes", desafio.id],
    queryFn: () => desafiosApi.participacoes(desafio.id),
    enabled: aberto,
  });

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["desafios"] });
    if (aberto) {
      void queryClient.invalidateQueries({ queryKey: ["desafios-participacoes", desafio.id] });
    }
  };

  const remover = useMutation({
    mutationFn: () => desafiosApi.remove(desafio.id),
    onSuccess: () => {
      toast(texts.desafios.removeDone, "success");
      onAbrir(null);
      void queryClient.invalidateQueries({ queryKey: ["desafios"] });
    },
    onError: () => toast(texts.desafios.removeError, "error"),
  });

  const encerrar = useMutation({
    mutationFn: (destaqueId: string) => desafiosApi.close(desafio.id, destaqueId),
    onSuccess: () => {
      toast(texts.desafios.closeDone, "success");
      invalidar();
    },
    onError: () => toast(texts.desafios.closeError, "error"),
  });

  const participar = useMutation({
    mutationFn: (content: string) => desafiosApi.participate(desafio.id, { content }),
    onSuccess: () => {
      toast(texts.desafios.participateSuccess, "success");
      invalidar();
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "CONTENT_TOO_LONG") {
        toast(texts.desafios.contentTooLongError, "error");
      } else if (codigo === "CONTENT_REQUIRED") {
        toast(texts.desafios.contentEmptyError, "error");
      } else if (codigo === "DESAFIO_FECHADO") {
        toast(texts.desafios.closedError, "error");
      } else if (codigo === "OWN_CHALLENGE") {
        toast(texts.desafios.ownChallengeError, "error");
      } else if (codigo === "RATE_LIMITED" || codigo === "TOO_MANY_REQUESTS") {
        toast(texts.desafios.rateLimitError, "error");
      } else {
        toast(texts.desafios.participateError, "error");
      }
    },
  });

  const removerParticipacao = useMutation({
    mutationFn: (participacaoId: string) =>
      desafiosApi.removeParticipacao(desafio.id, participacaoId),
    onSuccess: () => {
      toast(texts.desafios.removeParticipacaoDone, "success");
      invalidar();
    },
    onError: () => toast(texts.desafios.removeParticipacaoError, "error"),
  });

  const torcer = useMutation({
    mutationFn: (participacaoId: string) => desafiosApi.cheer(participacaoId),
    onSuccess: invalidar,
    onError: () => toast(texts.desafios.cheerError, "error"),
  });

  const destorcer = useMutation({
    mutationFn: (participacaoId: string) => desafiosApi.uncheer(participacaoId),
    onSuccess: invalidar,
    onError: () => toast(texts.desafios.cheerError, "error"),
  });

  const estadoMural: DesafiosParticipacoesState = mural.isLoading
    ? ({ kind: "loading" } as const)
    : mural.isError || !mural.data
      ? ({ kind: "error" } as const)
      : { kind: mural.data.items.length === 0 ? ("empty" as const) : ("ready" as const) };

  return (
    <>
      <DesafiosCard
        desafio={desafio}
        timeLeft={tempoRestante(desafio)}
        onOpen={() => onAbrir(aberto ? null : desafio.id)}
        onRemove={() => void remover.mutateAsync()}
        onReport={() => setDenuncia(true)}
      />

      {aberto && (
        <DesafiosParticipacoes
          desafio={desafio}
          state={estadoMural}
          participacoes={(mural.data?.items ?? []).map(paraParticipacao)}
          onParticipate={async (entrada) => {
            await participar.mutateAsync(entrada.content);
          }}
          onCheer={(participacaoId) => torcer.mutate(participacaoId)}
          onUncheer={(participacaoId) => destorcer.mutate(participacaoId)}
          onRemoveParticipacao={(participacaoId) =>
            void removerParticipacao.mutateAsync(participacaoId)
          }
          onClose={(destaqueId) => encerrar.mutate(destaqueId)}
        />
      )}

      {/* Denúncia de qualquer alvo: o mesmo formulário e os mesmos alvos do resto da plataforma. */}
      <ReportDialog
        targetId={desafio.id}
        targetType="DESAFIO_POST"
        open={denuncia}
        onOpenChange={setDenuncia}
      />
    </>
  );
}

// ---- Tradução das views do backend para os modelos do design system ----
//
// Desafios são NOMINAIS: o backend manda o autor completo (nome, @, avatar e estilo do nome)
// e a tela só monta. Quem reconhece o próprio convite (e a própria participação) é o `mine`
// que o servidor calculou a partir da sessão; a torcida vem contada, nunca nominada.

function paraCard(desafio: DesafioView): DesafioCardView {
  return {
    id: desafio.id,
    title: desafio.title,
    description: desafio.description,
    author: desafio.author,
    createdAt: desafio.createdAt,
    endsAt: desafio.endsAt,
    status: desafio.status,
    destaqueId: desafio.destaqueId,
    participacoes: desafio.participacoes,
    isMine: desafio.mine,
  };
}

function paraParticipacao(participacao: DesafioParticipacaoView): DesafioMuralView {
  return {
    id: participacao.id,
    desafioId: participacao.desafioId,
    author: participacao.author,
    content: participacao.content,
    createdAt: participacao.createdAt,
    cheers: participacao.cheers,
    cheered: participacao.cheered,
    isMine: participacao.mine,
  };
}

/** "termina em 3 dias" / "termina em 5 horas"; nulo quando não há prazo ou ele já passou. */
function tempoRestante(desafio: DesafioCardView): string | null {
  if (!desafio.endsAt || desafio.status === "CLOSED") return null;
  const faltaMs = new Date(desafio.endsAt).getTime() - Date.now();
  if (faltaMs <= 0) return null;

  const formatador = new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" });
  const minutos = Math.round(faltaMs / 60000);
  if (minutos < 60) return formatador.format(-minutos, "minute");
  const horas = Math.round(minutos / 60);
  if (horas < 48) return formatador.format(-horas, "hour");
  return formatador.format(-Math.round(horas / 24), "day");
}
