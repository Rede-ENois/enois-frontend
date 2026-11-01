import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { RepostDialog as RepostDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, reactionsApi } from "@/lib/api";
import { updatePostInQueryCache } from "@/lib/feed/post-query-cache";

/**
 * Republicar em duas portas: direto (cópia com o crédito) ou COM opinião — o comentário vira o
 * texto da publicação e o post original aparece citado embaixo, como um quote-repost.
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

  const repost = useMutation({
    mutationFn: (text?: string) => reactionsApi.repost(postId, text),
    onSuccess: () => {
      toast(texts.posts.reposted, "success");
      updatePostInQueryCache(queryClient, postId, (current) => ({
        ...current,
        currentUserReposted: true,
        counters: { ...current.counters, reposts: current.counters.reposts + 1 },
      }));
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
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
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
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
      pending={repost.isPending || undo.isPending}
      reposted={reposted}
      onRepost={(opinion) => repost.mutate(opinion)}
      onUndoRepost={() => undo.mutate()}
    />
  );
}
