import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { RepostDialog as RepostDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, reactionsApi } from "@/lib/api";
import { refreshFeedFirstPage, updatePostInQueryCache } from "@/lib/feed/post-query-cache";
import { communityQueries } from "@/lib/query-options/communities";

/**
 * Republicar em três portas: direto (cópia com o crédito), COM opinião — o comentário vira o
 * texto da publicação e o post original aparece citado embaixo — ou NA COMUNIDADE escolhida,
 * que vai para o mural da comunidade com comentário obrigatório.
 *
 * Quando o post já foi repostado, mostra a opção de desfazer.
 */
export function RepostDialog({
  postId,
  reposted,
  open,
  onOpenChange,
}: {
  postId: string;
  reposted: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Comunidades do viewer: o diálogo só lista; sem a lista carregada a porta nem aparece.
  // Reaproveita o cache da lista "minhas comunidades" em vez de buscar de novo.
  const minhasComunidades = useQuery({
    ...communityQueries.mine(50),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const repost = useMutation({
    mutationFn: (text?: string) => reactionsApi.repost(postId, text),
    onSuccess: () => {
      toast(texts.posts.reposted, "success");
      updatePostInQueryCache(queryClient, postId, (current) => ({
        ...current,
        currentUserReposted: true,
        counters: { ...current.counters, reposts: current.counters.reposts + 1 },
      }));
      // A republicação entra no topo do feed: confere a primeira página de cada feed na tela, sem
      // refazer as páginas que a pessoa já carregou.
      void refreshFeedFirstPage(queryClient);
      onOpenChange(false);
    },
    onError: (error) => {
      toast(
        error instanceof ApiError && error.code === "ALREADY_REPOSTED"
          ? texts.posts.alreadyReposted
          : texts.posts.repostError,
        "error",
      );
    },
  });

  const repostComunidade = useMutation({
    mutationFn: ({ communityId, opinion }: { communityId: string; opinion: string }) =>
      reactionsApi.repostToCommunity(postId, communityId, opinion),
    onSuccess: () => {
      toast(texts.posts.repostedCommunity, "success");
      onOpenChange(false);
    },
    onError: (error) => {
      toast(
        error instanceof ApiError && error.code === "ALREADY_REPOSTED"
          ? texts.posts.alreadyReposted
          : texts.posts.repostError,
        "error",
      );
    },
  });

  const undo = useMutation({
    mutationFn: () => reactionsApi.undoRepost(postId),
    onSuccess: () => {
      toast(texts.posts.repostRemoved, "success");
      updatePostInQueryCache(queryClient, postId, (current) => ({
        ...current,
        currentUserReposted: false,
        counters: { ...current.counters, reposts: Math.max(0, current.counters.reposts - 1) },
      }));
      // Desfazer tira a republicação do topo: mesma conferência da primeira página, sem refazer
      // as páginas já carregadas.
      void refreshFeedFirstPage(queryClient);
      onOpenChange(false);
    },
    onError: () => {
      toast(texts.posts.repostError, "error");
    },
  });

  return (
    <RepostDialogView
      postId={postId}
      open={open}
      onOpenChange={onOpenChange}
      pending={repost.isPending || undo.isPending || repostComunidade.isPending}
      reposted={reposted}
      onRepost={(opinion) => repost.mutate(opinion)}
      onUndoRepost={() => undo.mutate()}
      communities={(minhasComunidades.data?.items ?? []).map((community) => ({
        id: community.id,
        name: community.name,
      }))}
      onRepostToCommunity={(communityId, opinion) =>
        repostComunidade.mutate({ communityId, opinion })
      }
    />
  );
}
