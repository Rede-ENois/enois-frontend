import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { REACTION_PICKER_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { ColagemCommentView as ColagemCommentApi } from "@/types/application/colagem/colagem-comment-view";
import type { ColagemPostView } from "@/types/application/colagem/colagem-post-view";
import {
  ColagemComposer,
  ColagemPhotoDialog,
  ColagemPhotoGrid,
} from "@rede-enois/design-system/domain";
import type {
  ColagemCommentInput,
  ColagemCommentView,
  ColagemPhotoDetail,
  ColagemPublishInput,
  ComposerMediaDraft,
} from "@rede-enois/design-system/domain";
import { PageHeader, useToast } from "@rede-enois/design-system/ui";
import { z } from "zod";

import { colagemApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { requireAuth } from "@/lib/require-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { AppContainer } from "@/components/app-container";

/**
 * A Colagem: o feed fotográfico do Explorar, quase um grupo — espaço só dele, nada aparece no
 * feed Tudo. O desenho (compositor, grade, diálogo, contribuições) vive no design system; aqui
 * ficam os dados: queries do mural, upload dos anexos e as mutações de publicar, reagir,
 * contribuir e remover.
 */
const searchSchema = z.object({
  /** Deep link de notificação: abre a foto do aviso direto. */
  foto: z.string().optional(),
});

export const Route = createFileRoute("/colagem")({
  beforeLoad: requireAuth,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: texts.colagem.seoTitle }] }),
  component: ColagemPage,
});

function ColagemPage() {
  const { foto } = Route.useSearch();
  const [aberta, setAberta] = useState<string | null>(null);

  // Notificação aponta para /colagem?foto=<id>: a foto do aviso abre sozinha.
  useEffect(() => {
    if (foto) {
      setAberta(foto);
    }
  }, [foto]);

  const feed = useInfiniteQuery({
    queryKey: ["colagem"],
    queryFn: ({ pageParam }) => colagemApi.feed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const fotos = feed.data?.pages.flatMap((page) => page.items).map(paraResumo) ?? [];
  const estado = feed.isLoading
    ? ({ kind: "loading" } as const)
    : feed.isError
      ? ({ kind: "error" } as const)
      : fotos.length === 0
        ? ({ kind: "empty" } as const)
        : ({ kind: "ready" } as const);

  return (
    <AppContainer>
      <PageHeader title={texts.colagem.title} description={texts.colagem.subtitle} />
      <ColagemPublicacao />
      <ColagemPhotoGrid
        photos={fotos}
        state={estado}
        onOpen={setAberta}
        hasMore={feed.hasNextPage}
        loadingMore={feed.isFetchingNextPage}
        onLoadMore={() => void feed.fetchNextPage()}
      />

      {aberta && (
        <ColagemDetalhe postId={aberta} onOpenChange={(open) => !open && setAberta(null)} />
      )}
    </AppContainer>
  );
}

/** O compositor da Colagem: o app sobe a foto escolhida e entrega o rascunho pronto ao DS. */
function ColagemPublicacao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const upload = useMediaUpload();
  const [rascunho, setRascunho] = useState<ComposerMediaDraft | null>(null);

  const publicar = useMutation({
    mutationFn: (entrada: ColagemPublishInput) => {
      const mediaId = rascunho?.mediaId;
      if (!mediaId) {
        return Promise.reject(new Error("sem-foto"));
      }
      return colagemApi.publish({
        mediaId,
        description: entrada.description,
        mediaSpoiler: entrada.mediaSpoiler || undefined,
      });
    },
    onSuccess: () => {
      toast(texts.colagem.publishSuccess, "success");
      setRascunho(null);
      void queryClient.invalidateQueries({ queryKey: ["colagem"] });
    },
    onError: (erro) => {
      if (erro instanceof Error && erro.message === "sem-foto") {
        return;
      }
      const codigo = (erro as { code?: string }).code;
      if (codigo === "RATE_LIMITED" || codigo === "TOO_MANY_REQUESTS") {
        toast(texts.colagem.rateLimitError, "error");
      } else if (codigo === "RESTRICTED" || codigo === "SANCTIONED") {
        toast(texts.colagem.restrictedError, "error");
      } else if (codigo === "CONTENT_TOO_LONG") {
        toast(texts.colagem.captionTooLongError, "error");
      } else {
        toast(texts.colagem.publishError, "error");
      }
    },
  });

  const escolher = async (files: File[]) => {
    const arquivo = files[0];
    if (!arquivo) return;
    setRascunho({ preview: URL.createObjectURL(arquivo), status: "checking" });
    try {
      const resultado = await upload.upload(arquivo);
      setRascunho({ preview: resultado.cdnUrl, status: "allowed", mediaId: resultado.mediaId });
    } catch {
      // A falha do upload já chega com o aviso do hook; o rascunho sai da fila.
      setRascunho(null);
    }
  };

  return (
    <ColagemComposer
      attachment={rascunho}
      onFiles={(files) => void escolher(files)}
      onRemoveAttachment={() => setRascunho(null)}
      // A promessa rejeita quando a publicação recusa: o DS mantém o rascunho para corrigir.
      onPublish={async (entrada) => {
        await publicar.mutateAsync(entrada);
      }}
    />
  );
}

/** O detalhe aberto: a foto, as reações de uma por pessoa e as contribuições. */
function ColagemDetalhe({
  postId,
  onOpenChange,
}: {
  postId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const upload = useMediaUpload();
  const [rascunhoComentario, setRascunhoComentario] = useState<ComposerMediaDraft | null>(null);

  const consulta = useQuery({
    queryKey: ["colagem-post", postId],
    queryFn: () => colagemApi.post(postId),
  });
  const comentarios = useQuery({
    queryKey: ["colagem-comments", postId],
    queryFn: () => colagemApi.comments(postId),
  });

  const invalidarFoto = () => {
    void queryClient.invalidateQueries({ queryKey: ["colagem-post", postId] });
    void queryClient.invalidateQueries({ queryKey: ["colagem-comments", postId] });
    void queryClient.invalidateQueries({ queryKey: ["colagem"] });
  };

  const reagir = useMutation({
    // Uma reação por pessoa: tocar na mesma pílula remove; outra troca.
    mutationFn: async (tipo: string) => {
      if (tipo === consulta.data?.myReaction) {
        await colagemApi.unreact(postId);
        return {};
      }
      return colagemApi.react(postId, tipo);
    },
    onSuccess: invalidarFoto,
    onError: () => toast(texts.posts.reactions.error, "error"),
  });

  const contribuir = useMutation({
    mutationFn: (entrada: ColagemCommentInput) =>
      colagemApi.comment(postId, {
        parentCommentId: entrada.parentCommentId,
        content: entrada.content,
        mediaId: entrada.mediaId,
      }),
    onSuccess: () => {
      toast(texts.colagem.commentSuccess, "success");
      setRascunhoComentario(null);
      invalidarFoto();
    },
    onError: (erro) => {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "COMMENT_TOO_LONG") {
        toast(texts.colagem.commentTooLongError, "error");
      } else if (codigo === "COMMENT_EMPTY") {
        toast(texts.colagem.commentEmptyError, "error");
      } else if (codigo === "PHOTO_REPLY_NOT_ALLOWED") {
        toast(texts.colagem.replyBlocked, "error");
      } else {
        toast(texts.colagem.commentError, "error");
      }
    },
  });

  const removerComentario = useMutation({
    mutationFn: (commentId: string) => colagemApi.removeComment(postId, commentId),
    onSuccess: () => {
      toast(texts.colagem.deleteCommentDone, "success");
      invalidarFoto();
    },
    onError: () => toast(texts.colagem.commentError, "error"),
  });

  const removerFoto = useMutation({
    mutationFn: () => colagemApi.removePost(postId),
    onSuccess: () => {
      toast(texts.colagem.deletePhotoDone, "success");
      void queryClient.invalidateQueries({ queryKey: ["colagem"] });
      onOpenChange(false);
    },
    // Sem toast: a recusa aparece no aviso do próprio diálogo (o DS segura a promessa).
  });

  const escolherFoto = async (files: File[]) => {
    const arquivo = files[0];
    if (!arquivo) return;
    setRascunhoComentario({ preview: URL.createObjectURL(arquivo), status: "checking" });
    try {
      const resultado = await upload.upload(arquivo);
      setRascunhoComentario({
        preview: resultado.cdnUrl,
        status: "allowed",
        mediaId: resultado.mediaId,
      });
    } catch {
      setRascunhoComentario(null);
    }
  };

  const euId = me?.id ?? null;
  const foto = consulta.data ? paraDetalhe(consulta.data, euId) : null;

  return (
    <ColagemPhotoDialog
      open
      onOpenChange={onOpenChange}
      photo={foto}
      photoState={
        consulta.isLoading
          ? ({ kind: "loading" } as const)
          : consulta.isError
            ? ({ kind: "error" } as const)
            : ({ kind: "ready" } as const)
      }
      comments={(comentarios.data?.items ?? []).map((comentario) =>
        paraComentario(comentario, euId),
      )}
      commentsState={
        comentarios.isLoading
          ? ({ kind: "loading" } as const)
          : comentarios.isError
            ? ({ kind: "error" } as const)
            : ({ kind: "ready" } as const)
      }
      emojis={REACTION_PICKER_EMOJIS}
      reactionPending={reagir.isPending}
      onToggleReaction={(tipo) => reagir.mutate(tipo)}
      // Rejeita quando a contribuição recusa: o DS mantém o rascunho na linha.
      onComment={async (entrada) => {
        await contribuir.mutateAsync(entrada);
      }}
      onRemoveComment={async (commentId) => {
        await removerComentario.mutateAsync(commentId);
      }}
      onRemovePhoto={async () => {
        await removerFoto.mutateAsync();
      }}
      commentAttachment={rascunhoComentario}
      onCommentFiles={(files) => void escolherFoto(files)}
      onRemoveCommentAttachment={() => setRascunhoComentario(null)}
    />
  );
}

// ---- Tradução das views do backend para os modelos do design system ----

function paraResumo(post: ColagemPostView) {
  return {
    id: post.id,
    mediaUrl: post.mediaUrl,
    description: post.description,
    mediaSpoiler: post.mediaSpoiler,
    authorName: post.author.name,
    reactions: post.reactions,
    comments: post.comments,
  };
}

function paraDetalhe(post: ColagemPostView, euId: string | null): ColagemPhotoDetail {
  return {
    ...paraResumo(post),
    authorAvatar: post.author.avatar,
    authorAvatarFrame: post.author.avatarFrame,
    authorStyle: post.author.style,
    reactionSummary: Object.fromEntries(Object.entries(post.reactionSummary)),
    myReaction: post.myReaction,
    isOwner: euId === post.author.id,
  };
}

function paraComentario(comentario: ColagemCommentApi, euId: string | null): ColagemCommentView {
  return {
    id: comentario.id,
    authorName: comentario.author.name,
    authorAvatar: comentario.author.avatar,
    authorStyle: comentario.author.style,
    content: comentario.content,
    mediaUrl: comentario.mediaUrl,
    mediaSpoiler: comentario.mediaSpoiler,
    isMine: euId === comentario.author.id,
  };
}
