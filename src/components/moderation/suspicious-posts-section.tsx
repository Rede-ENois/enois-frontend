import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { SuspiciousPostsSection as SuspiciousPostsSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { moderationApi } from "@/lib/api";

function signalsOf(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as { signals?: unknown };
    return Array.isArray(parsed.signals) ? parsed.signals.map(String) : [];
  } catch {
    return [];
  }
}

/** Posts denunciados com score alto: revisão e exclusão em lote com motivo auditável. */
export function SuspiciousPostsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["moderator", "suspicious-posts"],
    queryFn: () => moderationApi.suspiciousPosts(30, 50),
    retry: false,
  });

  const remove = useMutation({
    mutationFn: ({ postIds, reason }: { postIds: string[]; reason: string }) =>
      moderationApi.bulkDeleteSuspiciousPosts(postIds, reason),
    onSuccess: (result) => {
      const deleted = result.items.filter((item) => item.status === "DELETED").length;
      const failed = result.items.length - deleted;
      toast(texts.moderator.suspiciousPosts.result(deleted, failed), failed ? "error" : "success");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "suspicious-posts"] });
    },
    onError: (error) => {
      toast(
        error instanceof Error ? error.message : texts.moderator.suspiciousPosts.error,
        "error",
      );
    },
  });

  if (query.isError) return null; // 403 = não é do time de moderação

  const posts = (query.data ?? []).map((item) => ({
    ...item,
    signals: signalsOf(item.signals),
    href: `/post/${item.postId}`,
  }));

  return (
    <SuspiciousPostsSectionView
      loading={query.isLoading}
      posts={posts}
      deletePending={remove.isPending}
      onDelete={(postIds, reason) =>
        remove.mutateAsync({ postIds, reason }).then(
          () => true,
          () => false,
        )
      }
    />
  );
}
