import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { RepostDialog as RepostDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, reactionsApi } from "@/lib/api";

/**
 * Republicar em duas portas: direto (cópia com o crédito) ou COM opinião — o comentário vira o
 * texto da publicação e o post original aparece citado embaixo, como um quote-repost.
 */
export function RepostDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const repost = useMutation({
    mutationFn: (text?: string) => reactionsApi.repost(postId, text),
    onSuccess: () => {
      toast(texts.posts.reposted, "success");
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

  return (
    <RepostDialogView
      postId={postId}
      open={open}
      onOpenChange={onOpenChange}
      pending={repost.isPending}
      onRepost={(opinion) => repost.mutate(opinion)}
    />
  );
}
