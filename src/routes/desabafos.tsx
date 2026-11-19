import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { DesabafoPostView } from "@/types/application/desabafos/desabafo-post-view";
import type { DesabafosCommentView as DesabafosCommentApi } from "@/types/application/desabafos/desabafos-comment-view";
import { DesabafosCard, DesabafosComposer, DesabafosFeed } from "@rede-enois/design-system/domain";
import type {
  DesabafoPostView as DesabafoCardView,
  DesabafosCommentInput,
  DesabafosCommentView,
  DesabafosFeedState,
  DesabafosReactionOffered,
} from "@rede-enois/design-system/domain";
import { PageHeader, useToast } from "@rede-enois/design-system/ui";
import { z } from "zod";

import { desabafosApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { ReportDialog } from "@/components/post/report-dialog";

/**
 * Os Desabafos: o feed de texto acolhedor do Explorar, quase um grupo — espaço só dele, nada
 * aparece no feed Tudo, no perfil ou na busca. O desenho (compositor, linha do tempo, cards e
 * acolhidas) vive no design system; aqui ficam os dados: queries do feed e as mutações de
 * publicar, apoiar, acolher e remover. Reação é contada, nunca nominada; sem gamificação.
 */
const searchSchema = z.object({
  /** Deep link de notificação: abre as acolhidas do desabafo avisado direto. */
  post: z.string().optional(),
});

export const Route = createFileRoute("/desabafos")({
  beforeLoad: requireAuth,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: texts.desabafos.seoTitle }] }),
  component: DesabafosPage,
});

function DesabafosPage() {
  const { post: postAvisado } = Route.useSearch();
  // Só UM feed de acolhidas aberto por vez: o desabafo do aviso abre sozinho.
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    if (postAvisado) {
      setAberto(postAvisado);
    }
  }, [postAvisado]);

  const feed = useInfiniteQuery({
    queryKey: ["desabafos"],
    queryFn: ({ pageParam }) => desabafosApi.feed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const posts = feed.data?.pages.flatMap((page) => page.items).map(paraCard) ?? [];
  const estado: DesabafosFeedState = feed.isLoading
    ? { kind: "loading" }
    : feed.isError
      ? { kind: "error" }
      : posts.length === 0
        ? { kind: "empty" }
        : { kind: "ready" };

  return (
    <AppContainer>
      <PageHeader title={texts.desabafos.title} description={texts.desabafos.subtitle} />
      <DesabafosPublicacao />
      <DesabafosFeed
        posts={posts}
        state={estado}
        hasMore={feed.hasNextPage}
        loadingMore={feed.isFetchingNextPage}
        onLoadMore={() => void feed.fetchNextPage()}
        renderCard={(post) => (
          <DesabafosCardAberto
            key={post.id}
            post={post}
            aberto={aberto === post.id}
            onAbrir={setAberto}
          />
        )}
      />
    </AppContainer>
  );
}

/** O compositor dos Desabafos: o app publica e avisa; o DS desenha o campo e a contagem. */
function DesabafosPublicacao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publicar = useMutation({
    mutationFn: (entrada: { content: string }) => desabafosApi.publish(entrada),
    onSuccess: () => {
      toast(texts.desabafos.publishSuccess, "success");
      void queryClient.invalidateQueries({ queryKey: ["desabafos"] });
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "RATE_LIMITED" || codigo === "TOO_MANY_REQUESTS") {
        toast(texts.desabafos.rateLimitError, "error");
      } else if (codigo === "RESTRICTED" || codigo === "SANCTIONED") {
        toast(texts.desabafos.restrictedError, "error");
      } else if (codigo === "CONTENT_TOO_LONG") {
        toast(texts.desabafos.contentTooLongError, "error");
      } else {
        toast(texts.desabafos.publishError, "error");
      }
    },
  });

  return (
    <DesabafosComposer
      onPublish={async (entrada) => {
        await publicar.mutateAsync(entrada);
      }}
    />
  );
}

/** O card de um desabafo: apoio contado e, quando aberto, as acolhidas do próprio card. */
function DesabafosCardAberto({
  post,
  aberto,
  onAbrir,
}: {
  post: DesabafoCardView;
  aberto: boolean;
  onAbrir: (postId: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [denuncia, setDenuncia] = useState(false);

  const comentarios = useQuery({
    queryKey: ["desabafos-comments", post.id],
    queryFn: () => desabafosApi.comments(post.id),
    enabled: aberto,
  });

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["desabafos"] });
    if (aberto) {
      void queryClient.invalidateQueries({ queryKey: ["desabafos-comments", post.id] });
    }
  };

  const apoiar = useMutation({
    // Uma reação por pessoa: tocar na pílula do meu apoio remove; a outra troca.
    mutationFn: async (tipo: DesabafosReactionOffered) => {
      if (tipo === post.myReaction) {
        await desabafosApi.unreact(post.id);
        return;
      }
      await desabafosApi.react(post.id, tipo);
    },
    onSuccess: invalidar,
    onError: () => toast(texts.desabafos.reactionError, "error"),
  });

  const remover = useMutation({
    mutationFn: () => desabafosApi.removePost(post.id),
    onSuccess: () => {
      toast(texts.desabafos.removeDone, "success");
      onAbrir(null);
      void queryClient.invalidateQueries({ queryKey: ["desabafos"] });
    },
    onError: () => toast(texts.desabafos.removeError, "error"),
  });

  const acolher = useMutation({
    mutationFn: (entrada: DesabafosCommentInput) => desabafosApi.comment(post.id, entrada),
    onSuccess: () => {
      toast(texts.desabafos.commentSuccess, "success");
      invalidar();
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "COMMENT_TOO_LONG") {
        toast(texts.desabafos.commentTooLongError, "error");
      } else if (codigo === "COMMENT_EMPTY") {
        toast(texts.desabafos.commentEmptyError, "error");
      } else {
        toast(texts.desabafos.commentError, "error");
      }
    },
  });

  const removerComentario = useMutation({
    mutationFn: (commentId: string) => desabafosApi.removeComment(post.id, commentId),
    onSuccess: () => {
      toast(texts.desabafos.removeCommentDone, "success");
      invalidar();
    },
    onError: () => toast(texts.desabafos.commentError, "error"),
  });

  const estadoAcolhidas = comentarios.isLoading
    ? ({ kind: "loading" } as const)
    : comentarios.isError
      ? ({ kind: "error" } as const)
      : ({ kind: "ready" } as const);

  return (
    <>
      <DesabafosCard
        post={post}
        commentsOpen={aberto}
        comments={(comentarios.data?.items ?? []).map(paraAcolhida)}
        commentsState={estadoAcolhidas}
        onToggleComments={() => onAbrir(aberto ? null : post.id)}
        onReact={(tipo) => apoiar.mutate(tipo)}
        onUnreact={() => apoiar.mutate(post.myReaction ?? "SUPPORT")}
        onRemove={() => void remover.mutateAsync()}
        onComment={async (entrada) => {
          await acolher.mutateAsync(entrada);
        }}
        onRemoveComment={(commentId) => void removerComentario.mutateAsync(commentId)}
        onReport={() => setDenuncia(true)}
      />

      {/* Denúncia de qualquer alvo: o mesmo formulário e os mesmos alvos do resto da plataforma. */}
      <ReportDialog
        targetId={post.id}
        targetType="DESABAFO_POST"
        open={denuncia}
        onOpenChange={setDenuncia}
      />
    </>
  );
}

// ---- Tradução das views do backend para os modelos do design system ----
//
// O anonimato é do contrato: o backend não manda autor, então a tela não tem nome, avatar nem
// estilo a montar. Quem reconhece o próprio desabafo (e a própria acolhida) é o `mine` que o
// servidor calculou a partir da sessão.

function paraCard(post: DesabafoPostView): DesabafoCardView {
  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    reactions: post.reactions,
    reactionSummary: { ...post.reactionSummary },
    myReaction:
      post.myReaction === "LOVE" || post.myReaction === "SUPPORT" ? post.myReaction : null,
    comments: post.comments,
    isMine: post.mine,
  };
}

function paraAcolhida(comentario: DesabafosCommentApi): DesabafosCommentView {
  return {
    id: comentario.id,
    content: comentario.content,
    isMine: comentario.mine,
  };
}
