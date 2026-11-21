import { useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import {
  ColecaoFormulario,
  ColecaoPostCartao,
  ColecaoQuadro,
} from "@rede-enois/design-system/domain";
import { Button, EmptyState, PageHeader, useToast } from "@rede-enois/design-system/ui";

import { colecoesApi } from "@/lib/api";
import { mensagemDeErroColecao } from "@/lib/colecoes-helpers";
import { quadroAusente } from "@/lib/detalhe-de-quadro";
import { postIdDoElo } from "@/lib/post-links";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";

/**
 * A página de uma coleção: a pasta (você edita e remove — ela é sua), a barra de guardar post
 * salvo e as publicações guardadas — cada uma renderizada pelo card de sempre do feed, porque a
 * publicação continua sendo ela mesma: comentário, reação e moderação acontecem lá, nunca na
 * coleção. Coleção é privada: coleção alheia nem abre.
 */
export const Route = createFileRoute("/colecoes/$colecaoId")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.colecoes.seoTitle }] }),
  component: ColecaoPage,
});

function ColecaoPage() {
  const { colecaoId } = Route.useParams();
  const quadro = useQuery({
    queryKey: ["colecao", colecaoId],
    queryFn: () => colecoesApi.get(colecaoId),
  });

  if (quadro.isLoading) {
    return (
      <AppContainer>
        <PageHeader title={texts.colecoes.title} description={texts.colecoes.subtitle} />
      </AppContainer>
    );
  }

  if (quadro.isError) {
    // Só o 404 é "não existe mais": sessão que não chegou e servidor fora do ar ganham o erro com
    // recarga, senão a pessoa vai procurar um problema que não é dela.
    const missing = quadroAusente(quadro.error);
    return (
      <AppContainer>
        <PageHeader title={texts.colecoes.title} description={texts.colecoes.subtitle} />

        <EmptyState
          title={missing ? texts.colecoes.naoEncontrado : texts.colecoes.erroLeitura}
          description={missing ? undefined : texts.colecoes.erroLeituraHint}
        >
          {!missing && (
            <Button variant="outline" size="sm" onClick={() => void quadro.refetch()}>
              {texts.colecoes.tentarDeNovo}
            </Button>
          )}
        </EmptyState>
      </AppContainer>
    );
  }

  if (!quadro.data) {
    return (
      <AppContainer>
        <PageHeader title={texts.colecoes.title} description={texts.colecoes.subtitle} />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <PageHeader title={texts.colecoes.title} description={texts.colecoes.subtitle} />
      <ColecaoAberta colecao={quadro.data} />
    </AppContainer>
  );
}

function ColecaoAberta({ colecao }: { colecao: Awaited<ReturnType<typeof colecoesApi.get>> }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editando, setEditando] = useState(false);
  const [guardarErro, setGuardarErro] = useState<string | null>(null);

  const guardados = useInfiniteQuery({
    queryKey: ["colecoes-posts", colecao.id],
    queryFn: ({ pageParam }) => colecoesApi.posts(colecao.id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
  const posts = guardados.data?.pages.flatMap((page) => page.items) ?? [];

  const editar = useMutation({
    mutationFn: (dados: { title: string; description: string }) =>
      colecoesApi.edit(colecao.id, { title: dados.title, description: dados.description }),
    onSuccess: () => {
      toast(texts.colecoes.editado, "success");
      setEditando(false);
      void queryClient.invalidateQueries({ queryKey: ["colecao", colecao.id] });
      void queryClient.invalidateQueries({ queryKey: ["colecoes"] });
    },
    onError: (erro) => {
      toast(mensagemDeErroColecao(erro, texts.colecoes.erroEditar), "error");
    },
  });

  const removerColecao = useMutation({
    mutationFn: () => colecoesApi.remove(colecao.id),
    onSuccess: () => {
      toast(texts.colecoes.removido, "success");
      void queryClient.invalidateQueries({ queryKey: ["colecoes"] });
      void navigate({ to: "/colecoes" });
    },
    onError: () => {
      toast(texts.colecoes.erroRemover, "error");
    },
  });

  const guardar = useMutation({
    mutationFn: (postId: string) => colecoesApi.addPost(colecao.id, postId),
    onSuccess: () => {
      toast(texts.colecoes.guardado, "success");
      setGuardarErro(null);
      void queryClient.invalidateQueries({ queryKey: ["colecoes-posts", colecao.id] });
      void queryClient.invalidateQueries({ queryKey: ["colecao", colecao.id] });
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "NAO_SALVO") {
        setGuardarErro(texts.colecoes.naoSalvo);
      } else if (codigo === "JA_NA_COLECAO") {
        setGuardarErro(texts.colecoes.jaNaColecao);
      } else if (codigo === "POST_NOT_FOUND") {
        setGuardarErro(texts.colecoes.postNaoEncontrado);
      } else if (codigo === "RATE_LIMITED" || codigo === "TOO_MANY_REQUESTS") {
        setGuardarErro(texts.colecoes.rateLimitError);
      } else if (codigo === "RESTRICTED" || codigo === "SANCTIONED") {
        setGuardarErro(texts.colecoes.restrictedError);
      } else {
        setGuardarErro(texts.colecoes.erroGuardar);
      }
    },
  });

  const tirar = useMutation({
    mutationFn: (postId: string) => colecoesApi.removePost(colecao.id, postId),
    onSuccess: () => {
      toast(texts.colecoes.tirado, "success");
      void queryClient.invalidateQueries({ queryKey: ["colecoes-posts", colecao.id] });
      void queryClient.invalidateQueries({ queryKey: ["colecao", colecao.id] });
    },
    onError: () => {
      toast(texts.colecoes.erroTirar, "error");
    },
  });

  return (
    <>
      <ColecaoQuadro
        colecao={colecao}
        onEditar={() => setEditando(true)}
        onRemover={() => void removerColecao.mutateAsync().catch(() => undefined)}
        onGuardar={(elo) => {
          const postId = postIdDoElo(elo);
          if (postId.length > 0) {
            void guardar.mutateAsync(postId).catch(() => undefined);
          }
        }}
        guardando={guardar.isPending}
        guardarErro={guardarErro}
      >
        {posts.map((salvo) => (
          <ColecaoPostCartao
            key={salvo.postId}
            info={{ postId: salvo.postId, adicionadoAt: salvo.adicionadoAt }}
            onRemover={() => void tirar.mutateAsync(salvo.postId).catch(() => undefined)}
          >
            <PostCard post={salvo.post} />
          </ColecaoPostCartao>
        ))}
      </ColecaoQuadro>

      <ColecaoFormulario
        aberto={editando}
        tituloInicial={colecao.title}
        descricaoInicial={colecao.description ?? ""}
        ocupado={editar.isPending}
        onSalvar={(dados) => {
          void editar.mutateAsync(dados).catch(() => undefined);
        }}
        onFechar={() => setEditando(false)}
      />
    </>
  );
}
