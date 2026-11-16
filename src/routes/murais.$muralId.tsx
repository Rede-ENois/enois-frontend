import { useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { MuralContribuicao } from "@/types/application/murais/mural-contribuicao";
import {
  MuralContribuicaoCartao,
  MuralFormulario,
  MuralQuadro,
} from "@rede-enois/design-system/domain";
import { EmptyState, PageHeader, useToast } from "@rede-enois/design-system/ui";

import { muraisApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { mensagemDeErroMural as mensagemDeErro } from "@/lib/murais-helpers";
import { postIdDoElo } from "@/lib/post-links";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";

/**
 * A página de um mural: o quadro (dono edita/remove), a barra de colar publicação e as
 * publicações coladas — cada uma renderizada pelo card de sempre do feed, porque a publicação
 * continua sendo ela mesma: comentário, reação e moderação acontecem lá, nunca no mural.
 */
export const Route = createFileRoute("/murais/$muralId")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.murais.seoTitle }] }),
  component: MuralPage,
});

function MuralPage() {
  const { muralId } = Route.useParams();
  const { data: user } = useCurrentUser();
  const quadro = useQuery({ queryKey: ["mural", muralId], queryFn: () => muraisApi.get(muralId) });

  if (quadro.isLoading) {
    return (
      <AppContainer>
        <PageHeader title={texts.murais.title} description={texts.murais.subtitle} />
      </AppContainer>
    );
  }

  if (quadro.isError || !quadro.data) {
    return (
      <AppContainer>
        <PageHeader title={texts.murais.title} description={texts.murais.subtitle} />
        <EmptyState title={texts.murais.naoEncontrado} />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <PageHeader title={texts.murais.title} description={texts.murais.subtitle} />
      <MuralAberto mural={quadro.data} euId={user?.id ?? null} />
    </AppContainer>
  );
}

function MuralAberto({
  mural,
  euId,
}: {
  mural: Awaited<ReturnType<typeof muraisApi.get>>;
  euId: string | null;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ehDono = euId != null && mural.owner.id === euId;

  const [editando, setEditando] = useState(false);
  const [colarErro, setColarErro] = useState<string | null>(null);

  const colados = useInfiniteQuery({
    queryKey: ["murais-contribuicoes", mural.id],
    queryFn: ({ pageParam }) => muraisApi.contributions(mural.id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
  const contribuicoes = colados.data?.pages.flatMap((page) => page.items) ?? [];

  const editar = useMutation({
    mutationFn: (dados: { title: string; description: string }) =>
      muraisApi.edit(mural.id, { title: dados.title, description: dados.description }),
    onSuccess: () => {
      toast(texts.murais.editado, "success");
      setEditando(false);
      void queryClient.invalidateQueries({ queryKey: ["mural", mural.id] });
      void queryClient.invalidateQueries({ queryKey: ["murais"] });
    },
    onError: (erro) => {
      toast(mensagemDeErro(erro, texts.murais.erroEditar), "error");
    },
  });

  const removerMural = useMutation({
    mutationFn: () => muraisApi.remove(mural.id),
    onSuccess: () => {
      toast(texts.murais.removido, "success");
      void queryClient.invalidateQueries({ queryKey: ["murais"] });
      void navigate({ to: "/murais" });
    },
    onError: () => {
      toast(texts.murais.erroRemover, "error");
    },
  });

  const colar = useMutation({
    mutationFn: (postId: string) => muraisApi.contribute(mural.id, postId),
    onSuccess: () => {
      toast(texts.murais.colado, "success");
      setColarErro(null);
      void queryClient.invalidateQueries({ queryKey: ["murais-contribuicoes", mural.id] });
      void queryClient.invalidateQueries({ queryKey: ["mural", mural.id] });
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "JA_NO_MURAL") {
        setColarErro(texts.murais.jaNoMural);
      } else if (codigo === "POST_NOT_FOUND") {
        setColarErro(texts.murais.postNaoEncontrado);
      } else if (codigo === "RATE_LIMITED" || codigo === "TOO_MANY_REQUESTS") {
        setColarErro(texts.murais.rateLimitError);
      } else if (codigo === "RESTRICTED" || codigo === "SANCTIONED") {
        setColarErro(texts.murais.restrictedError);
      } else {
        setColarErro(texts.murais.erroColar);
      }
    },
  });

  const tirar = useMutation({
    mutationFn: (postId: string) => muraisApi.removeContribution(mural.id, postId),
    onSuccess: () => {
      toast(texts.murais.tirado, "success");
      void queryClient.invalidateQueries({ queryKey: ["murais-contribuicoes", mural.id] });
      void queryClient.invalidateQueries({ queryKey: ["mural", mural.id] });
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      toast(
        codigo === "NOT_AUTHORIZED" ? texts.murais.naoAutorizado : texts.murais.erroTirar,
        "error",
      );
    },
  });

  return (
    <>
      <MuralQuadro
        mural={mural}
        ehDono={ehDono}
        onEditar={() => setEditando(true)}
        onRemover={() => void removerMural.mutateAsync().catch(() => undefined)}
        onColar={(elo) => {
          const postId = postIdDoElo(elo);
          if (postId.length > 0) {
            void colar.mutateAsync(postId).catch(() => undefined);
          }
        }}
        colando={colar.isPending}
        colarErro={colarErro}
      >
        {contribuicoes.map((contribuicao) => (
          <MuralContribuicaoCartao
            key={contribuicao.postId}
            info={{
              postId: contribuicao.postId,
              addedBy: contribuicao.addedBy,
              addedAt: contribuicao.addedAt,
            }}
            podeRemover={ehDono || contribuicao.addedBy.id === euId}
            onRemover={() => void tirar.mutateAsync(contribuicao.postId).catch(() => undefined)}
          >
            <PostCard post={contribuicao.post} />
          </MuralContribuicaoCartao>
        ))}
      </MuralQuadro>

      <MuralFormulario
        aberto={editando}
        tituloInicial={mural.title}
        descricaoInicial={mural.description ?? ""}
        ocupado={editar.isPending}
        onSalvar={(dados) => {
          void editar.mutateAsync(dados).catch(() => undefined);
        }}
        onFechar={() => setEditando(false)}
      />
    </>
  );
}
