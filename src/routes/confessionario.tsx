import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ConfissaoCommentView as ConfissaoCommentApi } from "@/types/application/confessionario/confissao-comment-view";
import type { ConfissaoPostView } from "@/types/application/confessionario/confissao-post-view";
import {
  ConfessionarioCard,
  ConfessionarioComposer,
  ConfessionarioFeed,
} from "@rede-enois/design-system/domain";
import type {
  ConfessionarioCommentInput,
  ConfessionarioCommentView,
  ConfessionarioFeedState,
  ConfessionarioReactionOffered,
  ConfissaoPostView as ConfissaoCardView,
} from "@rede-enois/design-system/domain";
import { PageHeader, useToast } from "@rede-enois/design-system/ui";
import { z } from "zod";

import { confessionarioApi } from "@/lib/api";
import { getEnoisEmojiByCode } from "@/lib/emotes/enois-pack";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { ReportDialog } from "@/components/post/report-dialog";

/**
 * O Confessionário: o espaço de histórias do Explorar — experiências, situações constrangedoras,
 * confissões. Tom de contar, diferente dos Desabafos (que acolhem o que dói). Espaço só dele:
 * nada aparece no feed Tudo, no perfil ou na busca, e ninguém tem nome aqui. O desenho (compositor,
 * linha do tempo, cards e comentários) vive no design system; aqui ficam os dados.
 */
const searchSchema = z.object({
  /** Deep link de notificação: abre os comentários da história avisada direto. */
  post: z.string().optional(),
});

export const Route = createFileRoute("/confessionario")({
  beforeLoad: requireAuth,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: texts.confessionario.seoTitle }] }),
  component: ConfessionarioPage,
});

function ConfessionarioPage() {
  const { post: postAvisado } = Route.useSearch();
  // Só UM bloco de comentários aberto por vez: a história do aviso abre sozinha.
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    if (postAvisado) {
      setAberto(postAvisado);
    }
  }, [postAvisado]);

  const feed = useInfiniteQuery({
    queryKey: ["confessionario"],
    queryFn: ({ pageParam }) => confessionarioApi.feed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const posts = feed.data?.pages.flatMap((page) => page.items).map(paraCard) ?? [];
  const estado: ConfessionarioFeedState = feed.isLoading
    ? { kind: "loading" }
    : feed.isError
      ? { kind: "error" }
      : posts.length === 0
        ? { kind: "empty" }
        : { kind: "ready" };

  return (
    <AppContainer>
      <PageHeader title={texts.confessionario.title} description={texts.confessionario.subtitle} />
      <ConfessionarioPublicacao />
      <ConfessionarioFeed
        posts={posts}
        state={estado}
        hasMore={feed.hasNextPage}
        loadingMore={feed.isFetchingNextPage}
        onLoadMore={() => void feed.fetchNextPage()}
        renderCard={(post) => (
          <ConfissaoCardAberta
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

/** O compositor do Confessionário: o app publica e avisa; o DS desenha o campo e a contagem. */
function ConfessionarioPublicacao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publicar = useMutation({
    mutationFn: (entrada: { content: string }) => confessionarioApi.publish(entrada),
    onSuccess: () => {
      toast(texts.confessionario.publishSuccess, "success");
      void queryClient.invalidateQueries({ queryKey: ["confessionario"] });
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "RATE_LIMITED" || codigo === "TOO_MANY_REQUESTS") {
        toast(texts.confessionario.rateLimitError, "error");
      } else if (codigo === "RESTRICTED" || codigo === "SANCTIONED") {
        toast(texts.confessionario.restrictedError, "error");
      } else if (codigo === "CONTENT_TOO_LONG") {
        toast(texts.confessionario.contentTooLongError, "error");
      } else {
        toast(texts.confessionario.publishError, "error");
      }
    },
  });

  return (
    <ConfessionarioComposer
      onPublish={async (entrada) => {
        await publicar.mutateAsync(entrada);
      }}
    />
  );
}

/** O card de uma história: reações contadas e, quando abertos, os comentários do próprio card. */
function ConfissaoCardAberta({
  post,
  aberto,
  onAbrir,
}: {
  post: ConfissaoCardView;
  aberto: boolean;
  onAbrir: (postId: string | null) => void;
}) {
  // A surpresa do confessionário é o Chocado do pacote É Nóis; sem o pacote, o DS fica no glifo.
  const reactionIcons = { WOW: { src: getEnoisEmojiByCode("enois_wow")?.src ?? "" } };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [denuncia, setDenuncia] = useState(false);

  const comentarios = useQuery({
    queryKey: ["confessionario-comments", post.id],
    queryFn: () => confessionarioApi.comments(post.id),
    enabled: aberto,
  });

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["confessionario"] });
    if (aberto) {
      void queryClient.invalidateQueries({ queryKey: ["confessionario-comments", post.id] });
    }
  };

  const reagir = useMutation({
    // Uma reação por pessoa: tocar na pílula da minha reação remove; outra troca.
    mutationFn: async (tipo: ConfessionarioReactionOffered) => {
      if (tipo === post.myReaction) {
        await confessionarioApi.unreact(post.id);
        return;
      }
      await confessionarioApi.react(post.id, tipo);
    },
    onSuccess: invalidar,
    onError: () => toast(texts.confessionario.reactionError, "error"),
  });

  const remover = useMutation({
    mutationFn: () => confessionarioApi.removePost(post.id),
    onSuccess: () => {
      toast(texts.confessionario.removeDone, "success");
      onAbrir(null);
      void queryClient.invalidateQueries({ queryKey: ["confessionario"] });
    },
    onError: () => toast(texts.confessionario.removeError, "error"),
  });

  const comentar = useMutation({
    mutationFn: (entrada: ConfessionarioCommentInput) =>
      confessionarioApi.comment(post.id, entrada),
    onSuccess: () => {
      toast(texts.confessionario.commentSuccess, "success");
      invalidar();
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "COMMENT_TOO_LONG") {
        toast(texts.confessionario.commentTooLongError, "error");
      } else if (codigo === "COMMENT_EMPTY") {
        toast(texts.confessionario.commentEmptyError, "error");
      } else {
        toast(texts.confessionario.commentError, "error");
      }
    },
  });

  const removerComentario = useMutation({
    mutationFn: (commentId: string) => confessionarioApi.removeComment(post.id, commentId),
    onSuccess: () => {
      toast(texts.confessionario.removeCommentDone, "success");
      invalidar();
    },
    onError: () => toast(texts.confessionario.commentError, "error"),
  });

  const estadoComentarios = comentarios.isLoading
    ? ({ kind: "loading" } as const)
    : comentarios.isError
      ? ({ kind: "error" } as const)
      : ({ kind: "ready" } as const);

  return (
    <>
      <ConfessionarioCard
        post={post}
        commentsOpen={aberto}
        reactionIcons={reactionIcons}
        comments={(comentarios.data?.items ?? []).map(paraComentario)}
        commentsState={estadoComentarios}
        onToggleComments={() => onAbrir(aberto ? null : post.id)}
        onReact={(tipo) => reagir.mutate(tipo)}
        onUnreact={() => reagir.mutate(post.myReaction ?? "LAUGH")}
        onRemove={() => void remover.mutateAsync()}
        onComment={async (entrada) => {
          await comentar.mutateAsync(entrada);
        }}
        onRemoveComment={(commentId) => void removerComentario.mutateAsync(commentId)}
        onReport={() => setDenuncia(true)}
      />

      {/* Denúncia de qualquer alvo: o mesmo formulário e os mesmos alvos do resto da plataforma. */}
      <ReportDialog
        targetId={post.id}
        targetType="CONFESSIONARIO_POST"
        open={denuncia}
        onOpenChange={setDenuncia}
      />
    </>
  );
}

// ---- Tradução das views do backend para os modelos do design system ----
//
// O anonimato é do contrato: o backend não manda autor, então a tela não tem nome, avatar nem
// estilo a montar. Quem reconhece a própria história (e o próprio comentário) é o `mine` que o
// servidor calculou a partir da sessão.

function paraCard(post: ConfissaoPostView): ConfissaoCardView {
  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    reactions: post.reactions,
    reactionSummary: { ...post.reactionSummary },
    myReaction:
      post.myReaction === "LAUGH" || post.myReaction === "WOW" || post.myReaction === "SUPPORT"
        ? post.myReaction
        : null,
    comments: post.comments,
    isMine: post.mine,
  };
}

function paraComentario(comentario: ConfissaoCommentApi): ConfessionarioCommentView {
  return {
    id: comentario.id,
    content: comentario.content,
    isMine: comentario.mine,
  };
}
